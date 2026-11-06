import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import dbConnect from '@/db/dbConnect'
import { UserModel } from '@/db/models'
import { throw404 } from '@/helpers/APIHelper'


type UserSettingsSource = {
  get?: (key: string) => string | number | boolean | undefined
  defaultTimer?: number
  autofillSessionName?: boolean
  replaceTopicOnTimeout?: boolean
  allowOvertime?: boolean
}

const readSetting = <T>(
  settings: UserSettingsSource | undefined,
  key: keyof UserSettingsSource,
  fallback: T,
): T => {
  if (!settings) return fallback

  if ('get' in settings && typeof settings.get === 'function') {
    const value = settings.get(key as string)
    if (value !== undefined) return value as T
  }

  const directValue = settings[key as keyof UserSettingsSource]
  return directValue !== undefined ? (directValue as T) : fallback
}

const getUserSettings = (settings?: UserSettingsSource) => ({
  defaultTimer: readSetting(settings, 'defaultTimer', 60),
  autofillSessionName: readSetting(settings, 'autofillSessionName', false),
  replaceTopicOnTimeout: readSetting(settings, 'replaceTopicOnTimeout', false),
  allowOvertime: readSetting(settings, 'allowOvertime', false),
})

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
        replaceTopicOnTimeout: false,
        allowOvertime: false,
      }
    }

    const existingPlayer = await UserModel.exists({ username: username, email: email })
    if (!existingPlayer) {
      try {
        const player = new UserModel({
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
      return res.json({
        ...user.toObject(),
        settings: getUserSettings(user.settings),
      })
    } else if (req?.query?.username) {
      const user = await UserModel.findOne({ username: req?.query?.username })
      if (!user) {
        return throw404(res, `Player ${req?.query?.username} Does not have an account`)
      }
      res.setHeader('Content-Type', 'application/json')
      return res.json({
        ...user.toObject(),
        settings: getUserSettings(user.settings),
      })
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
