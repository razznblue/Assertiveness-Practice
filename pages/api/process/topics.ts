import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import topics from '@/seeddata/topics'
import { TopicModel } from '@/db/models'
import dbConnect from '@/db/dbConnect'

/*
  Retrieves an image object from Unsplash for a given topic.
  Returns an object containing photoId, imageUrl, photographerName, photographerUrl, and photoUrl.
*/
const getTopicImageObject = async (topic: string) => {
  const unsplashURL = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(topic)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
  const imgResponse = await axios.get(unsplashURL)
  const chosenImage = imgResponse?.data?.results?.[0]

  if (!chosenImage) {
    throw new Error(`No Unsplash image found for topic ${topic}`)
  }

  const unsplashParameters = '?utm_source=Assertiveness-Practice&utm_medium=referral'

  const photographerFullName = `${chosenImage.user.first_name || ''} ${chosenImage.user.last_name || ''}`
  const finalPhotographerName = photographerFullName.trim() || chosenImage.user.username
  return {
    photoId: chosenImage.id,
    imageUrl: chosenImage.urls.regular,
    photographerName: finalPhotographerName,
    photographerUrl: `${chosenImage.user.links.html}${unsplashParameters}`,
    photoUrl: `${chosenImage.links.html}${unsplashParameters}`,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  const requestedSize = Number(req?.query?.size)
  const size = Number.isFinite(requestedSize) && requestedSize > 0
    ? Math.min(requestedSize, 20)
    : 10
  let backfillAmount = 0

  /* process DB Topics */
  if (req?.query?.all === 'true') {
    const topicsMissingImages = await TopicModel.find({
      $or: [
        { unsplashImage: { $exists: false } },
        { unsplashImage: null },
      ],
    }).limit(20)
    let updatedCount = 0

    for (const topic of topicsMissingImages) {
      try {
        topic.unsplashImage = await getTopicImageObject(topic.name)
        await topic.save()
        updatedCount++
        console.log(`Fetched new image for topic ${topic.name}: ${topic.unsplashImage.imageUrl}`)
      } catch (error) {
        const errorStatus = axios.isAxiosError(error) ? error.response?.status : undefined
        console.error(`Error processing Unsplash image for topic ${topic.name}`, { status: errorStatus })
        const remainingCount = await TopicModel.countDocuments({
          $or: [
            { unsplashImage: { $exists: false } },
            { unsplashImage: null },
          ],
        })
        return res.status(500).json({
          error: `Failed to process Unsplash image for topic ${topic.name}`,
          attemptedCount: updatedCount + 1,
          updatedCount,
          remainingCount,
        })
      }
    }

    const remainingCount = await TopicModel.countDocuments({
      $or: [
        { unsplashImage: { $exists: false } },
        { unsplashImage: null },
      ],
    })
    return res.status(200).json({
      message: `Processed ${updatedCount} topics`,
      limit: 20,
      updatedCount,
      remainingCount,
    })
  }

  /* Log Helpful Information for Topics Without Images */
  if (req?.query?.infoOnly === 'true') {
    const allTopics = await TopicModel.find()
    let countWithoutImage = 0

    for (const topic of allTopics) {
      if (!topic.unsplashImage) {
        console.log(`Topic: ${topic.name} does not have an image`)
        countWithoutImage++
      } else {
        console.log(`Topic: ${topic.name}, Image: ${topic.unsplashImage.imageUrl}`)
      }
    }
    console.log(`Total topics without an Unsplash image: ${countWithoutImage}`)
    return res.send({ countWithoutImage, topics: allTopics })
  }

  /* Backfill topics from seeddata */
  let count = 0
  for (const topicName of topics) {
    if (count < size) {
      const exists = await TopicModel.findOne({ name: topicName })
      if (!exists) {
        const newTopic = new TopicModel()
        newTopic.name = topicName.toString()
        newTopic.unsplashImage = await getTopicImageObject(topicName.toString())
        await newTopic.save()
        console.log(`Saved new Topic ${topicName}`)
        backfillAmount++
        count++
      } else if (!exists.unsplashImage) {
        exists.unsplashImage = await getTopicImageObject(topicName.toString())
        if (exists.unsplashImage) {
          console.log(`Fetched new image for existing topic ${topicName}: ${exists.unsplashImage.imageUrl}`)
        }
        await exists.save()
        count++
        backfillAmount++
      }
    }
  }

  console.log('Completed Saving Topics')
  return res.send(`Backfilled ${backfillAmount} Topics to DB`)
}
