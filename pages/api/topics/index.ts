import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import dbConnect from '@/db/dbConnect'
import { TopicModel } from '@/db/models'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  const method = req?.method
  if (method === 'GET') {
    const allTopics = await TopicModel.find({})
    if (allTopics) {
      return res.status(200).json(allTopics)
    }
    return res.status(404).json({ error: 'Topics not found' })
  }

  if (method === 'POST') {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name not found on Request Body' })
    }

    const existingTopic = await TopicModel.findOne({ name })
    if (existingTopic) {
      return res.status(409).json({ error: 'Topic already exists', topic: existingTopic })
    }

    // Fetch an Image via the Unsplash API
    const unsplashURL = `https://api.unsplash.com/search/photos?query=${name}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
    const imgResponse = await axios.get(unsplashURL)
    const chosenImage = imgResponse?.data?.results[0];

    const unsplashParameters = "?utm_source=Assertiveness-Practice&utm_medium=referral";

    // Build UnsplashImageDTO
    const photographerFullName = (chosenImage.user.first_name || '') + ' ' + (chosenImage.user.last_name || '')
    const finalPhotographerName = photographerFullName.trim() || chosenImage.user.username
    const unsplashImageDto = {
      photoId: chosenImage.id,
      imageUrl: chosenImage.urls.regular,
      photographerName: finalPhotographerName,

      photographerUrl:
        `${chosenImage.user.links.html}${unsplashParameters}`,

      photoUrl:
        `${chosenImage.links.html}${unsplashParameters}`,
    }

    if (unsplashImageDto && unsplashImageDto.imageUrl) {
      const newTopic = new TopicModel({ name: name, image: unsplashImageDto.imageUrl, unsplashImage: unsplashImageDto })
      
      await newTopic.save()
      console.log('created new topic', { topic: newTopic })

      return res.status(201).json({ message: 'Topic created successfully', topic: newTopic })
    } else {
      return res.status(500).json({ error: 'Error creating Unsplash image' })
    }
  }

  return res.status(500).json({ error: `Method [${method}] not Supported` })
}
