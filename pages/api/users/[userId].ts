/* eslint-disable max-depth */
/* eslint-disable @typescript-eslint/no-require-imports */
import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '@/db/dbConnect'
const ObjectId = require('mongoose').Types.ObjectId
import { UserModel } from '@/db/models'
import { handleUnexpectedError, throw404 } from '@/helpers/APIHelper'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnect()

  try {
    const id: any = req?.query?.userId
    if (!ObjectId.isValid(id)) {
      return res.status(500).send(`Invalid ObjectID`)
    }

    /* UPDATE User */
    if (req.method === 'PATCH' && id) {
      try {
        const user = await UserModel.findById(id).exec()
        if (!user) return throw404(res, `player with ID ${id} does not exist`)
        if (user) {
          const updatedKeys: string[] = []
          for (const [key, value] of Object.entries(req?.body as Record<any, any>)) {
            if (user[key] !== undefined) {
              /* updating settings */
              if (key === 'settings') {
                if (value?.defaultTimer) {
                  user[key].defaultTimer = value?.defaultTimer
                  updatedKeys.push(key)
                }
                if (value?.autofillSessionName !== undefined) {
                  user[key].autofillSessionName = value?.autofillSessionName
                  updatedKeys.push(key)
                }
              } else {
                /* default updating */
                user[key] = value
                updatedKeys.push(key)
              }
            }
          }
          user.save()
          console.info('Updated player with fields: ', updatedKeys)
          return res.send(user)
        }
      } catch (err) {
        return handleUnexpectedError(res, err)
      }

      /* GET User */
    } else if (req?.method === 'GET' && id) {
      try {
        const user = await UserModel.findById(id)
        if (!user) {
          return throw404(res, `Player with Id ${id} not found`)
        }
        return res.send(user)
      } catch (err) {
        return handleUnexpectedError(res, err)
      }
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch (err) {
    return res.status(500).send({ error: 'Unknown Error Occurred' })
  }
}
