import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import dbConnect from '@/db/dbConnect'
import { SessionModel } from '@/db/models'
import { throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = session.user.role === 'admin'
  const sessionUsername = session.user.name

  if (req.method === 'POST') {
    const { name, userId, topicId, duration } = req.body

    if (!name || !userId) {
      return res.status(400).json({ error: 'name and userId are required' })
    }

    try {
      const newSession = new SessionModel({
        name,
        userId,
        topicId,
        duration,
        attemptCount: 0,
        status: 'active',
      })
      await newSession.save()
      console.info(`Created new session with Id ${newSession._id}`)
      return res.status(201).json(newSession.toJSON())
    } catch (err) {
      console.error(`Could not save session due to error ${err}`)
      return res.status(500).send('Unexpected Error. Check logs')
    }
  } else if (req.method === 'GET') {
    // Fetch sessions for a specific user
    if (req.query.userId) {
      const requestedUserId = req.query.userId

      // Non-admins can only fetch their own sessions
      if (!isAdmin && req.query.username !== sessionUsername) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const sessions = await SessionModel.find({ userId: requestedUserId })
        .populate('topicId')
        .lean()
      return res.status(200).json(sessions)
    }

    // Admins can fetch all sessions
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const sessions = await SessionModel.find({}).limit(10).populate('topicId').lean()
    return res.status(200).json(sessions)
  } else {
    return res.status(405).json({ error: `Method [${req.method}] not supported` })
  }
}
