import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import topics from '@/data/topics'
import { TopicModel } from '@/db/models'
import dbConnect from '@/db/dbConnect'

const getTopicImage = async (topic: string) => {
  try {
    console.log(`getting image for topic ${topic}`)
    const url = `https://api.unsplash.com/search/photos?query=${topic}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
    const res = await axios.get(url)
    if (res?.data && res?.data?.results) {
      return res?.data?.results[0].urls?.regular
    } else {
      return console.error('Could not find image on unsplash response', res?.data)
    }
  } catch (err: any) {
    return console.error(`Error retrieving image for topic ${topic}`, err)
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  const size: number = Number(req?.query?.size) || 10
  let backfillAmount = 0

  let count = 0
  for (const topicName of topics) {
    if (count < size) {
      const exists = await TopicModel.findOne({ name: topicName })
      if (!exists) {
        const newTopic = new TopicModel()
        newTopic.name = topicName
        newTopic.image = await getTopicImage(topicName)
        await newTopic.save()
        console.log(`Saved new Topic ${topicName}`)
        backfillAmount++
        count++
      } else {
        console.log(`Skipped existing topic ${topicName}`)
      }
    }
  }
  console.log('Completed Saving Topics')
  res.send(`Backfilled ${backfillAmount} Topics to DB`)
}
