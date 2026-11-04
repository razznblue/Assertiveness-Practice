import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const randomString = (length = 12) =>
  Array.from({ length }, () => Math.random().toString(36).charAt(2)).join('')

const getR2Config = () => {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error(
      'Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and optionally R2_PUBLIC_URL.'
    )
  }

  return {
    accountId,
    bucket,
    endpoint,
    publicUrl: process.env.R2_PUBLIC_URL || endpoint,
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    }),
  }
}

export const buildObjectUrl = (key: string) => {
  const { publicUrl, bucket } = getR2Config()
  const normalizedBaseUrl = publicUrl.replace(/\/$/, '')
  const normalizedBucket = bucket.replace(/^\//, '')

  if (process.env.R2_PUBLIC_URL) {
    return `${normalizedBaseUrl}/${key}`
  }

  return `${normalizedBaseUrl}/${normalizedBucket}/${key}`
}

export const uploadAudioToR2 = async ({
  fileBuffer,
  fileName,
  contentType,
  folder = 'audio',
}: {
  fileBuffer: Buffer
  fileName: string
  contentType?: string
  folder?: string
}): Promise<{ key: string; url: string }> => {
  const { client, bucket } = getR2Config()
  const extension = fileName?.split('.').pop()?.toLowerCase() || 'webm'
  const key = `${folder}/${Date.now()}-${randomString(10)}.${extension}`

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || 'audio/webm',
    })
  )

  return {
    key,
    url: buildObjectUrl(key),
  }
}

export const getSignedAudioUrl = async ({
  key,
  expiresIn = 60 * 60 * 24,
}: {
  key: string
  expiresIn?: number
}) => {
  const { client, bucket } = getR2Config()

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn }
  )
}

export const extractKeyFromUrl = (url: string) => {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const pathname = decodeURIComponent(parsed.pathname)
    const bucket = process.env.R2_BUCKET_NAME ? `/${process.env.R2_BUCKET_NAME}` : ''
    const normalized = pathname.startsWith(bucket) ? pathname.slice(bucket.length) : pathname
    return normalized.replace(/^\//, '') || null
  } catch (error) {
    return null
  }
}

export const deleteAudioFromR2 = async (key: string) => {
  const { client, bucket } = getR2Config()

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}
