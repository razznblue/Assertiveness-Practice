import { NextApiResponse } from 'next'

export const throw404 = (res: NextApiResponse, msg: string) => {
  console.error(msg)
  return res.status(404).send({ error: msg })
}

export const handleUnexpectedError = (res: NextApiResponse, err: unknown) => {
  console.error(err)
  return res.status(500).send({ error: 'Unexpected Error' })
}
