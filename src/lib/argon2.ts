import { hash, verify, type Options } from "@node-rs/argon2";

const options: Options = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string) {
  const result = await hash(password, options);
  return result;
}

export async function verifyPassword(data: { password: string; hash: string }) {
  const { password, hash } = data;

  const result = await verify(hash, password, options);
  return result;
}
