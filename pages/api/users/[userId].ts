/* eslint-disable max-depth */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import dbConnect from '@/db/dbConnect'
const ObjectId = require('mongoose').Types.ObjectId
import { UserModel } from '@/db/models'
import { handleUnexpectedError, throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const isAdmin = session.user.role === 'admin'
  const sessionUsername = session.user.name

  try {
    const id: any = req?.query?.userId
    if (!ObjectId.isValid(id)) {
      return res.status(400).send(`Invalid ObjectID`)
    }

    // Fetch the target user so we can compare username to session
    const targetUser = await UserModel.findById(id).exec()
    if (!targetUser) {
      return throw404(res, `Player with ID ${id} does not exist`)
    }

    // Non-admins can only access their own user
    if (!isAdmin && targetUser.username !== sessionUsername) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    /* UPDATE User */
    if (req.method === 'PATCH') {
      try {
        const updatedKeys: string[] = []
        for (const [key, value] of Object.entries(req?.body as Record<any, any>)) {
          // Non-admins cannot update sensitive fields
          if (!isAdmin && ['isAdmin', 'role', 'accessKey'].includes(key)) {
            return res.status(403).json({ error: `Forbidden: cannot update field "${key}"` })
          }

          if (targetUser[key] !== undefined) {
            if (key === 'settings') {
              if (value?.defaultTimer) {
                targetUser[key].defaultTimer = value?.defaultTimer
                updatedKeys.push(key)
              }
              if (value?.autofillSessionName !== undefined) {
                targetUser[key].autofillSessionName = value?.autofillSessionName
                updatedKeys.push(key)
              }
            } else {
              targetUser[key] = value
              updatedKeys.push(key)
            }
          }
        }
        await targetUser.save()
        console.log('Updated player with fields: ', updatedKeys)
        return res.send(targetUser)
      } catch (err) {
        return handleUnexpectedError(res, err)
      }

      /* GET User */
    } else if (req.method === 'GET') {
      return res.send(targetUser)
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch (err) {
    return res.status(500).send({ error: 'Unknown Error Occurred' })
  }
}
