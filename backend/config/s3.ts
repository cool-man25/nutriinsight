import { S3Client } from '@aws-sdk/client-s3';

let cachedClient: S3Client | null = null;

// Lazy-init so the server can boot without AWS credentials;
// only the upload endpoints require them at request time.
export function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      '文件上传未配置：缺少 AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY 环境变量'
    );
  }
  cachedClient = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return cachedClient;
}

export const S3_CONFIG = {
  BUCKET_NAME: process.env.BUCKET_NAME || '',
  REGION: process.env.AWS_REGION,
  FOLDER_PREFIX: 'user-content',
  PRESIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
} as const;
