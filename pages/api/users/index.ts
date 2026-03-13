import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/db/dbConnect'
import { UserModel } from '@/db/models'
import { throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  if (req?.method === 'POST') {
    console.info(req?.body)
    const username: string = req?.body?.username
    const email: string = req?.body?.email
    const provider = req?.body?.provider
    let settings = req?.body?.settings

    if (!settings) {
      console.debug('setting default settings')
      settings = {
        defaultTimer: 60,
        autofillSessionName: false,
      }
    }

    const existingPlayer = await UserModel.exists({ username: username, email: email })
    if (!existingPlayer) {
      try {
        const player: any = new UserModel({
          username: username,
          email: email,
          provider: provider,
          settings: settings,
        })
        await player.save()
        console.info(`Created new player with Id ${player?._id}`)
        return res.status(201).json(player?.toJSON())
      } catch (err) {
        console.error(`Could not save player due to error ${err}`)
        return res.status(500).send('Unexpected Error. Check logs')
      }
    } else {
      console.warn(`Player ${username} already exists`)
      return existingPlayer
    }
  } else if (req?.method === 'GET') {
    if (req?.query?.username && req?.query?.providerId) {
      console.log('name and providerId')
      const user = await UserModel.findOne({
        username: req?.query?.username,
        'provider.providerId': req?.query?.providerId,
      })
      if (!user) {
        return throw404(res, `Player ${req?.query?.username} Does not have an account`)
      }
      return res.json(user)
    } else if (req?.query?.username) {
      const user = await UserModel.findOne({ username: req?.query?.username })
      if (!user) {
        return throw404(res, `Player ${req?.query?.username} Does not have an account`)
      }
      console.log('returning single player')
      res.setHeader('Content-Type', 'application/json')
      return res.json(user)
    }
    const users = await UserModel.find({}).limit(10).lean()
    return res.json(users)
  } else {
    console.error('Method not Allowed')
  }
}
