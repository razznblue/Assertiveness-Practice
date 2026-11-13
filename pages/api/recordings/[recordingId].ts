/* eslint-disable @typescript-eslint/no-require-imports */
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
const ObjectId = require('mongoose').Types.ObjectId

import dbConnect from '@/db/dbConnect'
import { RecordingModel } from '@/db/models'
import { throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = session.user.role === 'admin'

  try {
    const id = Array.isArray(req.query.recordingId)
      ? req.query.recordingId[0]
      : req.query.recordingId
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ObjectID' })
    }

    const recording = await RecordingModel.findById(id).exec()
    if (!recording) {
      return throw404(res, `Recording with ID ${id} does not exist`)
    }

    // Non-admins can only access their own recordings
    if (!isAdmin && recording.userId.toString() !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'GET') {
      return res.status(200).json(recording)
    } else if (req.method === 'DELETE') {
      await RecordingModel.findByIdAndDelete(id)
      return res.status(200).json({ message: `Recording ${id} deleted` })
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch {
    return res.status(500).json({ error: 'Unknown Error Occurred' })
  }
}
