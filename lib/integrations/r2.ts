import "server-only";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { serverEnv } from "@/lib/env";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;

  const env = serverEnv();
  client = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return client;
}

export function avatarPublicUrl(key: string): string {
  const base = serverEnv().R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${key.replace(/^\/+/, "")}`;
}

export async function uploadObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const env = serverEnv();

  await getClient().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  const env = serverEnv();

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}
