import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { getServerSession } from 'next-auth'

import dbConnect from '@/db/dbConnect'
import { RecordingModel, SessionModel, UserModel } from '@/db/models'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import {
  deleteAudioFromR2,
  extractKeyFromUrl,
  getSignedAudioUrl,
  uploadAudioToR2,
} from '@/util/r2'

export const config = {
  api: {
    bodyParser: false,
  },
}

const getFieldValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0]
  return value ?? ''
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect()

  if (req.method === 'GET') {
    const username = req.query.username ? String(req.query.username) : ''
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const requestedUsername = username || session.user?.name
    if (!requestedUsername) {
      return res.status(400).json({ error: 'Username is required.' })
    }

    const currentUser = await UserModel.findOne({ username: requestedUsername }).lean()
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const sessions = await SessionModel.find({ userId: currentUser._id }).sort({ createdAt: -1 }).lean()
    const recordings = await RecordingModel.find({ userId: currentUser._id }).sort({ createdAt: -1 }).lean()

    const signedRecordings = await Promise.all(
      recordings.map(async (recording: any) => {
        const key = extractKeyFromUrl(recording.recordingUrl)
        if (!key) {
          return recording
        }

        try {
          return {
            ...recording,
            recordingUrl: await getSignedAudioUrl({ key, expiresIn: 60 * 60 * 24 * 7 }),
          }
        } catch (error) {
          console.warn('Could not sign R2 recording URL:', error)
          return recording
        }
      })
    )

    return res.status(200).json({
      sessions,
      recordings: signedRecordings,
      user: currentUser,
    })
  }

  if (req.method === 'DELETE') {
    const key = req.query.key ? String(req.query.key) : ''
    const recordingId = req.query.recordingId ? String(req.query.recordingId) : ''
    const sessionId = req.query.sessionId ? String(req.query.sessionId) : ''

    try {
      let objectKey = key
      let recordingToDelete: any = null

      if (recordingId) {
        recordingToDelete = await RecordingModel.findById(recordingId)
        if (recordingToDelete?.recordingUrl) {
          objectKey = extractKeyFromUrl(recordingToDelete.recordingUrl) || objectKey
        }
      }

      if (!objectKey && recordingToDelete?.recordingUrl) {
        objectKey = extractKeyFromUrl(recordingToDelete.recordingUrl)
      }

      if (objectKey) {
        try {
          await deleteAudioFromR2(objectKey)
        } catch (error) {
          console.warn('Failed to delete audio from R2 while removing recording:', error)
        }
      }

      if (recordingId) {
        await RecordingModel.findByIdAndDelete(recordingId)
        const deletedRecording = recordingToDelete ?? (await RecordingModel.findById(recordingId).lean())
        const sessionForRecording = deletedRecording?.sessionId ? String(deletedRecording.sessionId) : sessionId
        if (sessionForRecording) {
          await RecordingModel.deleteMany({ sessionId: sessionForRecording })
          await SessionModel.findByIdAndDelete(sessionForRecording)
        }
      } else if (sessionId) {
        await RecordingModel.deleteMany({ sessionId })
        await SessionModel.findByIdAndDelete(sessionId)
      }

      return res.status(200).json({ message: 'Recording deleted successfully.' })
    } catch (error) {
      console.error('Failed to delete audio from R2:', error)
      return res.status(500).json({ error: 'Failed to delete audio from storage.' })
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
      (resolve, reject) => {
        const form = formidable({
          multiples: false,
          maxFileSize: 100 * 1024 * 1024,
        })

        form.parse(req, (err, parsedFields, parsedFiles) => {
          if (err) {
            reject(err)
            return
          }

          resolve({ fields: parsedFields, files: parsedFiles })
        })
      }
    )

    const audioFile = files.audio
    const rawAudio = Array.isArray(audioFile) ? audioFile[0] : audioFile
    if (!rawAudio) {
      return res.status(400).json({ error: 'Audio file is required.' })
    }

    const sessionName = getFieldValue(fields.sessionName)
    const username = getFieldValue(fields.username) || getFieldValue(fields.userId)
    const topicId = getFieldValue(fields.topicId)
    const topicName = getFieldValue(fields.topicName)
    const timerValue = Number(getFieldValue(fields.timer))
    const timer = Number.isFinite(timerValue) && timerValue > 0 ? timerValue : 60

    if (!sessionName) {
      return res.status(400).json({ error: 'Session name is required.' })
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required to save this recording.' })
    }

    const user = await UserModel.findOne({ username }).lean()
    if (!user) {
      return res.status(404).json({ error: `User ${username} was not found.` })
    }

    const fileBuffer = await fs.promises.readFile(rawAudio.filepath)
    const upload = await uploadAudioToR2({
      fileBuffer,
      fileName: rawAudio.originalFilename || `${sessionName}.webm`,
      contentType: rawAudio.mimetype || 'audio/webm',
      folder: `sessions/${username}`,
    })

    try {
      let sessionDoc = await SessionModel.findOne({ name: sessionName, userId: user._id })

      if (!sessionDoc) {
        sessionDoc = new SessionModel({
          name: sessionName,
          userId: user._id,
        })
      }

      if (topicName) {
        sessionDoc.topicName = topicName
      }

      sessionDoc.timer = timer
      sessionDoc.name = sessionName
      sessionDoc.userId = user._id
      await sessionDoc.save()

      const recordingId = `recording-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const recordingDoc = await RecordingModel.create({
        recordingId,
        recordingUrl: upload.url,
        sessionId: sessionDoc._id,
        userId: user._id,
      })

      return res.status(201).json({
        message: 'Recording saved successfully.',
        session: sessionDoc.toJSON(),
        recording: recordingDoc.toJSON(),
        r2Key: upload.key,
        topicId,
      })
    } catch (error) {
      await deleteAudioFromR2(upload.key)
      throw error
    } finally {
      if (rawAudio.filepath) {
        await fs.promises.rm(rawAudio.filepath, { force: true }).catch(() => undefined)
      }
    }
  } catch (error) {
    console.error('Failed to save recording:', error)
    return res.status(500).json({ error: 'Failed to save recording.' })
  }
}
