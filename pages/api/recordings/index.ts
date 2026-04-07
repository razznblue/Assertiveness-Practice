import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import dbConnect from '@/db/dbConnect'
import { RecordingModel, SessionModel } from '@/db/models'
import { throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = session.user.role === 'admin'

  if (req.method === 'POST') {
    const { recordingId, recordingUrl, sessionId, userId, duration, fileSize } = req.body

    if (!recordingId || !recordingUrl || !sessionId || !userId) {
      return res
        .status(400)
        .json({ error: 'recordingId, recordingUrl, sessionId and userId are required' })
    }

    try {
      const newRecording = new RecordingModel({
        recordingId,
        recordingUrl,
        sessionId,
        userId,
        duration,
        fileSize,
      })
      await newRecording.save()

      // Increment attemptCount on the parent session
      await SessionModel.findByIdAndUpdate(sessionId, { $inc: { attemptCount: 1 } })

      console.info(`Created new recording with Id ${newRecording._id}`)
      return res.status(201).json(newRecording.toJSON())
    } catch (err) {
      console.error(`Could not save recording due to error ${err}`)
      return res.status(500).send('Unexpected Error. Check logs')
    }
  } else if (req.method === 'GET') {
    if (req.query.sessionId) {
      const recordings = await RecordingModel.find({ sessionId: req.query.sessionId }).lean()
      return res.status(200).json(recordings)
    }

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const recordings = await RecordingModel.find({}).limit(10).lean()
    return res.status(200).json(recordings)
  } else {
    return res.status(405).json({ error: `Method [${req.method}] not supported` })
  }
}
