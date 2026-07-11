import type { PanelKey, UserRole } from "./permissions";

export const SESSION_COOKIE = "mizaam_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: number;
  login: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  panels: PanelKey[];
  iat: number;
  exp: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getAuthSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-only-change-this-secret-before-production"
  );
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return base64ToBytes(base64);
}

function encodeJson(value: unknown) {
  return toBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(textDecoder.decode(fromBase64Url(value))) as T;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(payload: Omit<SessionUser, "iat" | "exp">) {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionUser = {
    ...payload,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encodeJson(fullPayload);
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  try {
    const key = await getSigningKey();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(encodedSignature),
      textEncoder.encode(encodedPayload)
    );
    if (!isValid) return null;

    const payload = decodeJson<SessionUser>(encodedPayload);
    if (!payload?.id || !payload?.role || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | null | undefined) {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((item) => {
    const [rawKey, ...rawValue] = item.trim().split("=");
    if (!rawKey) return;
    cookies.set(rawKey, decodeURIComponent(rawValue.join("=")));
  });

  return cookies;
}

export async function getSessionFromCookieHeader(cookieHeader: string | null | undefined) {
  const token = parseCookieHeader(cookieHeader).get(SESSION_COOKIE);
  return verifySession(token);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
