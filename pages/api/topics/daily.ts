import type { NextApiRequest, NextApiResponse } from 'next'
import { createHash } from 'crypto'

import dbConnect from '@/db/dbConnect'
import { TopicModel } from '@/db/models'

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getNextDayExpiration = (date = new Date()) => {
  const nextDay = new Date(date)
  nextDay.setHours(24, 0, 0, 0)
  return nextDay.getTime()
}

const dailyTopicCache: {
  dateKey: string | null
  topic: unknown
  expiresAt: number
} = {
  dateKey: null,
  topic: null,
  expiresAt: 0,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(409).send(`Method [${req.method}] not supported`)
  }

  const dateKey = getLocalDateKey()

  if (dailyTopicCache.dateKey === dateKey && Date.now() < dailyTopicCache.expiresAt) {
    return res.status(200).json({ topic: dailyTopicCache.topic, dateKey })
  }

  await dbConnect()

  const topics = await TopicModel.find({}).sort({ createdAt: 1, _id: 1 }).lean()
  if (!topics.length) {
    return res.status(404).json({ error: 'No topics found' })
  }

  const hash = createHash('sha256').update(dateKey).digest('hex')
  const index = parseInt(hash.slice(0, 8), 16) % topics.length
  const topicOfDay = topics[index]

  dailyTopicCache.dateKey = dateKey
  dailyTopicCache.topic = topicOfDay
  dailyTopicCache.expiresAt = getNextDayExpiration()

  return res.status(200).json({ topic: topicOfDay, dateKey })
}
