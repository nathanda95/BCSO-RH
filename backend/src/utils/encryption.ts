import crypto from "crypto";
import { env } from "../env";

const KEY_BYTES = 32;
let warned = false;

function getKey(): Buffer | null {
  if (!env.APP_ENCRYPTION_KEY) {
    if (!warned) {
      console.warn(
        "APP_ENCRYPTION_KEY is not set. Refresh tokens will be stored in plain text. Set APP_ENCRYPTION_KEY to enable AES-GCM encryption."
      );
      warned = true;
    }
    return null;
  }

  const key = Buffer.from(env.APP_ENCRYPTION_KEY, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error("APP_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function encryptToken(plainText: string): string {
  const key = getKey();
  if (!key) return plainText;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptToken(value: string): string {
  const key = getKey();
  if (!key) return value;

  if (!value.startsWith("v1:")) {
    return value;
  }

  const parts = value.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const data = Buffer.from(parts[3], "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
