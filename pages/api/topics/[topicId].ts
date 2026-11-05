/* eslint-disable @typescript-eslint/no-require-imports */
import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/db/dbConnect'
import { TopicModel } from '@/db/models'
const ObjectId = require('mongoose').Types.ObjectId
import { throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  const id = Array.isArray(req?.query?.topicId) ? req.query.topicId[0] : req?.query?.topicId
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).send(`Invalid ObjectID`)
  }

  const topic = await TopicModel.findById(id).exec()
  if (!topic) {
    return throw404(res, `Player with ID ${id} does not exist`)
  }

  return res.send(topic)
}
