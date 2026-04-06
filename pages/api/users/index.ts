import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import dbConnect from '@/db/dbConnect'
import { UserModel } from '@/db/models'
import { throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()
  const session = await getServerSession(req, res, authOptions)

  // Not logged in at all — block everything
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = session.user.role === 'admin'
  const sessionUsername = session.user.name

  if (req?.method === 'POST') {
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }

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
      const requestedUsername = req?.query?.username

      // Non-admins can only fetch their own info
      if (!isAdmin && requestedUsername !== sessionUsername) {
        return res.status(403).json({ error: 'Forbidden. Wrong User' })
      }

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
      res.setHeader('Content-Type', 'application/json')
      return res.json(user)
    }

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const users = await UserModel.find({}).limit(10).lean()
    return res.json(users)
  } else {
    console.error('Method not Allowed')
  }
}
