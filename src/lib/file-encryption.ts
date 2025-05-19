import { randomBytes, createCipheriv } from "crypto";

// Definisikan algoritma, kunci, dan panjang IV yang tepat
const algorithm = "aes-256-cbc";
const ivLength = 16; // IV harus 16 bytes untuk AES

// Pastikan secretKey memiliki panjang yang tepat (32 bytes untuk aes-256-cbc)
// Di sini kita menggunakan environment variable, tetapi pastikan panjangnya benar
export const secretKey = process.env.ENCRYPTION_KEY || "";

// Fungsi untuk memastikan kunci memiliki panjang yang benar (32 bytes)
function getValidKey() {
  // Jika kunci tidak ada atau panjang tidak sesuai
  if (!secretKey || Buffer.from(secretKey).length !== 32) {
    const errorMessage = !secretKey
      ? "ENCRYPTION_KEY tidak ditemukan di environment variables"
      : `ENCRYPTION_KEY harus tepat 32 byte, saat ini: ${Buffer.from(secretKey).length} byte`;

    console.error(errorMessage);

    // Gunakan kunci default hanya untuk development (TIDAK AMAN untuk produksi)
    // Untuk produksi, sebaiknya gagal daripada menggunakan kunci default
    if (process.env.NODE_ENV === "development") {
      return Buffer.from("01234567890123456789012345678901"); // 32 bytes
    } else {
      throw new Error(errorMessage);
    }
  }

  return Buffer.from(secretKey);
}

export async function encryptFile(buffer: Buffer) {
  const iv = randomBytes(ivLength);
  const key = getValidKey();

  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    encryptedData: encrypted,
    iv,
  };
}

export async function decryptFile(encryptedData: Buffer, ivHex: string) {
  const { createDecipheriv } = await import("crypto");
  const key = getValidKey();
  const iv = Buffer.from(ivHex, "hex");

  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted;
}
