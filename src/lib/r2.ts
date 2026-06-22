import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { decode } from "base64-arraybuffer";
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Polyfill for Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Polyfill for crypto if it's missing (needed for some SDK versions)
if (typeof global.crypto !== 'object') {
  global.crypto = {} as any;
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = require('react-native-get-random-values');
}

const R2_ENDPOINT = "https://addcf1e47e61304c9a4cb81981033fd8.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID = "0935955fbe114bddcd1440726f0c1ef5";
const R2_SECRET_ACCESS_KEY = "29f9336b1d6f9821b86de14847a687954bdfb3695e793943c2a4ae0e86444bb2";
const R2_BUCKET_NAME = "tabanapp";
const R2_PUBLIC_URL = "https://pub-6bbf4ee8c63f4041a86825b21a1e949e.r2.dev"; 

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const uploadToR2 = async (base64Data: string, fileName: string, contentType: string = "image/jpeg") => {
  try {
    const arrayBuffer = decode(base64Data);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: contentType,
    });

    await s3Client.send(command);

    const baseUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL : `${R2_PUBLIC_URL}/`;
    return `${baseUrl}${fileName}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("نەتوانرا وێنەکە باربکرێت، تکایە ئینتەرنێتەکەت کۆنتڕۆڵ بکەوە.");
  }
};
