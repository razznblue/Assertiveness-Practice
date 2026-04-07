import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import dbConnect from '@/db/dbConnect'
const ObjectId = require('mongoose').Types.ObjectId
import { SessionModel, RecordingModel } from '@/db/models'
import { handleUnexpectedError, throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = session.user.role === 'admin'
  const sessionUsername = session.user.name

  try {
    const id: any = req.query.sessionId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ObjectID' })
    }

    const targetSession = await SessionModel.findById(id).populate('topicId').exec()
    if (!targetSession) {
      return throw404(res, `Session with ID ${id} does not exist`)
    }

    // Non-admins can only access their own sessions
    if (!isAdmin && targetSession.userId.toString() !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'GET') {
      // Optionally include recordings
      if (req.query.includeRecordings) {
        const recordings = await RecordingModel.find({ sessionId: id }).lean()
        return res.status(200).json({ ...targetSession.toJSON(), recordings })
      }
      return res.status(200).json(targetSession)
    } else if (req.method === 'PATCH') {
      try {
        const allowedFields = ['name', 'duration', 'status', 'attemptCount']

        for (const [key, value] of Object.entries(req.body as Record<string, any>)) {
          if (!allowedFields.includes(key)) {
            return res.status(400).json({ error: `Field "${key}" cannot be updated` })
          }
          targetSession[key] = value
        }

        await targetSession.save()
        return res.status(200).json(targetSession)
      } catch (err) {
        return handleUnexpectedError(res, err)
      }
    } else if (req.method === 'DELETE') {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      await SessionModel.findByIdAndDelete(id)
      // Clean up associated recordings
      await RecordingModel.deleteMany({ sessionId: id })
      return res.status(200).json({ message: `Session ${id} and its recordings deleted` })
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch (err) {
    return res.status(500).json({ error: 'Unknown Error Occurred' })
  }
}
