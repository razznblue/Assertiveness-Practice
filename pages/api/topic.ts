import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/db/dbConnect'
import { TopicModel } from '@/db/models'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  const count = await TopicModel.countDocuments().exec()
  if (count === 0) {
    return res.send('No Topics found')
  }
  const randomIndex = Math.floor(Math.random() * count)
  const randomTopic = await TopicModel.findOne().skip(randomIndex).exec()
  res.json({ topic: randomTopic })
}
