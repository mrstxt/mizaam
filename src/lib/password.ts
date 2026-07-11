import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [algorithm, salt, key] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;

  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(key, "hex");
  if (storedKey.length !== derivedKey.length) return false;

  return timingSafeEqual(storedKey, derivedKey);
}

export function isStrongEnoughPassword(password: string) {
  return password.length >= 8;
}
