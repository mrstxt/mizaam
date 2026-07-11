export interface AccessDetails {
  login: string;
  password: string;
  loginUrl: string;
}

export const DEFAULT_PUBLIC_APP_URL = "https://mizaam.onrender.com";

function getPublicBaseUrl() {
  return DEFAULT_PUBLIC_APP_URL;
}

export function buildLoginUrl(_request: Request, login?: string | null) {
  const url = new URL("/login", getPublicBaseUrl());
  if (login) url.searchParams.set("login", login);
  return url.toString();
}

export function buildTenantLoginUrl(_request: Request, tenantLogin: string) {
  const safeTenantLogin = slugifyLogin(tenantLogin);
  return `${getPublicBaseUrl()}/${safeTenantLogin}/login`;
}

export function generatePassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const byte of bytes) result += alphabet[byte % alphabet.length];
  return result;
}

export function slugifyLogin(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 32);
}
