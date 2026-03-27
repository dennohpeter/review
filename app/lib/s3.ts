import { S3Client } from '@aws-sdk/client-s3'

const region = process.env.NEXT_PUBLIC_AWS_REGION
const BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET
const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY

if (!region || !BUCKET || !accessKeyId || !secretAccessKey) {
  throw new Error('AWS S3 configuration is missing in environment variables')
}

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})
