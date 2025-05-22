// src/lib/crypto.ts
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// Définir les constantes pour l'encryption
const algorithm = "aes-256-cbc";
const ivLength = 16;

// Use the existing encryption key or create a default one for development
export const secretKey = process.env.ENCRYPTION_KEY || "";

// Ensure the key has the correct length (32 bytes)
function getValidKey() {
  if (!secretKey || Buffer.from(secretKey).length !== 32) {
    const errorMessage = !secretKey
      ? "ENCRYPTION_KEY not found in environment variables"
      : `ENCRYPTION_KEY must be exactly 32 bytes, currently: ${Buffer.from(secretKey).length} bytes`;
    console.error(errorMessage);

    if (process.env.NODE_ENV === "development") {
      return Buffer.from("01234567890123456789012345678901"); // 32 bytes
    } else {
      throw new Error(errorMessage);
    }
  }
  return Buffer.from(secretKey);
}

// Function to encrypt data
export async function encrypt(data: string): Promise<string> {
  const iv = randomBytes(ivLength);
  const key = getValidKey();
  const cipher = createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(data, "utf-8")),
    cipher.final(),
  ]);

  // Return iv + encrypted data as hex string
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Function to decrypt data
export async function decrypt(encryptedData: string): Promise<string> {
  const [ivHex, dataHex] = encryptedData.split(":");

  if (!ivHex || !dataHex) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");
  const key = getValidKey();

  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

// Re-export the existing file encryption functions
export { encryptFile, decryptFile } from "./file-encryption";
