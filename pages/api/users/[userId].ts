/* eslint-disable @typescript-eslint/no-require-imports */
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
const ObjectId = require('mongoose').Types.ObjectId

import dbConnect from '@/db/dbConnect'
import { UserModel } from '@/db/models'
import { handleUnexpectedError, throw404 } from '@/helpers/APIHelper'

const defaultSettings = {
  defaultTimer: 60,
  autofillSessionName: false,
  replaceTopicOnTimeout: false,
  allowOvertime: false,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = session.user.role === 'admin'
  const sessionUsername = session.user.name

  try {
    const id = Array.isArray(req?.query?.userId) ? req.query.userId[0] : req?.query?.userId
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).send(`Invalid ObjectID`)
    }

    // Fetch the target user so we can compare username to session
    const targetUser = await UserModel.findById(id).exec()
    if (!targetUser) {
      return throw404(res, `Player with ID ${id} does not exist`)
    }
    console.log('Incoming settings:', req.body.settings)
console.log('Existing settings:', targetUser.settings)

    // Non-admins can only access their own user
    if (!isAdmin && targetUser.username !== sessionUsername) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    /* UPDATE User */
    if (req.method === 'PATCH') {
      try {
        const updatedKeys: string[] = []
        const payload = (req?.body ?? {}) as Record<string, unknown>
        const targetUserRecord = targetUser as unknown as Record<string, unknown>

        for (const [key, value] of Object.entries(payload)) {
          // Non-admins cannot update sensitive fields
          if (!isAdmin && ['isAdmin', 'role', 'accessKey'].includes(key)) {
            return res.status(403).json({ error: `Forbidden: cannot update field "${key}"` })
          }

        if (key === 'settings' && typeof value === 'object' && value !== null) {
            const currentSettings = {
              defaultTimer: targetUser.settings?.defaultTimer ?? 60,
              autofillSessionName: targetUser.settings?.autofillSessionName ?? false,
              replaceTopicOnTimeout: targetUser.settings?.replaceTopicOnTimeout ?? false,
              allowOvertime: targetUser.settings?.allowOvertime ?? false,
            }

            const nextSettings = {
              ...defaultSettings,
              ...currentSettings,
              ...value,
            }

            targetUser.settings = nextSettings

            updatedKeys.push(key)
          } else if (targetUserRecord[key] !== undefined) {
            targetUserRecord[key] = value
            updatedKeys.push(key)
          }
        }

        console.log('Settings before save:', targetUser.settings)

        await targetUser.save()
        console.log('Settings after save:', targetUser.settings)
        const updatedUser = await UserModel.findById(id).lean()

        console.log('Settings after save:', updatedUser?.settings)
        console.log('Updated player with fields: ', updatedKeys)
        return res.json({
          ...updatedUser,
          settings: {
            ...defaultSettings,
            ...(updatedUser?.settings ?? {}),
          },
        })
      } catch (err) {
        return handleUnexpectedError(res, err)
      }

      /* GET User */
    } else if (req.method === 'GET') {
      const userRecord = await UserModel.findById(id)

      if (!userRecord) {
        return throw404(res, `Player with ID ${id} does not exist`)
      }

      return res.status(200).json({
        userRecord
      })
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch {
    return res.status(500).send({ error: 'Unknown Error Occurred' })
  }
}
