export interface AccessDetails {
  login: string;
  password: string;
  loginUrl: string;
}

export function buildLoginUrl(request: Request, login?: string | null) {
  const url = new URL("/login", request.url);
  if (login) url.searchParams.set("login", login);
  return url.toString();
}

export function buildTenantLoginUrl(request: Request, tenantLogin: string, login?: string | null) {
  const safeTenantLogin = slugifyLogin(tenantLogin);
  const url = new URL(`/${safeTenantLogin}/login`, request.url);
  if (login) url.searchParams.set("login", login);
  return url.toString();
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
