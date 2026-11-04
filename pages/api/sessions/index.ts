import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'

import dbConnect from '@/db/dbConnect'
import { RecordingModel, SessionModel, UserModel } from '@/db/models'
import { deleteAudioFromR2, uploadAudioToR2 } from '@/util/r2'

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

  if (req.method === 'DELETE') {
    const key = req.query.key ? String(req.query.key) : ''

    if (!key) {
      return res.status(400).json({ error: 'Missing object key to delete.' })
    }

    try {
      await deleteAudioFromR2(key)
      return res.status(200).json({ message: 'Audio deleted from storage.' })
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
        await sessionDoc.save()
      }

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
