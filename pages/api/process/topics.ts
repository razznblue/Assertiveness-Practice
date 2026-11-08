import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import topics from '@/seeddata/topics'
import { TopicModel } from '@/db/models'
import dbConnect from '@/db/dbConnect'


const getTopicImage = async (topic: string) => {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${topic}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
    const res = await axios.get(url)
    if (res?.data && res?.data?.results) {
      return res?.data?.results[0].urls?.regular
    } else {
      return console.error('Could not find image on unsplash response', res?.data)
    }
  } catch (error) {
    return console.error(`Error retrieving image for topic ${topic}`, error.message, error.response.data)
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  const size: number = Number(req?.query?.size) || 10
  let backfillAmount = 0

  if (req?.query?.infoOnly === 'true') {
    const topics = await TopicModel.find();
    let countWithoutImage = 0

    for (const topic of topics) {
      if (!topic.image) {
        console.log(`Topic: ${topic.name} does not have an image`)
        countWithoutImage++
      } else {
        console.log(`Topic: ${topic.name}, Image: ${topic.image}`)
      }
    }
    console.log(`Total topics without an image: ${countWithoutImage}`)
    return res.send({ topics, countWithoutImage })
  }

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
        // count++
      } else if (!exists.image) {
        exists.image = await getTopicImage(topicName)
        if (exists.image) {
          console.log(`Fetched new image for existing topic ${topicName}: ${exists.image}`)
        }
        await exists.save()
        count++
        backfillAmount++
      }
    }
  }
  console.log('Completed Saving Topics')
  res.send(`Backfilled ${backfillAmount} Topics to DB`)
}
