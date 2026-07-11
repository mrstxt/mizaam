# MIZAAM deploy va login tizimi

## Hozirgi login talabi

Admin panelga kirish:

```text
/login
login: admin
parol: admin123
```

Agar database ichida admin user bo'lmasa, birinchi login paytida tizim `admin / admin123` accountni avtomatik yaratadi. Agar eski deployda admin bor-u parol boshqacha bo'lgan bo'lsa, admin paroli `admin123` ga bootstrap qilinadi. Admin sidebar pastidagi **Parolni o'zgartirish** tugmasi orqali parolni almashtirgandan keyin `admin123` qayta ishlamaydi.

## Qo'shilgan funksiyalar

- `/login` sahifasi login/parol orqali kiradi.
- Admin default: `admin / admin123`.
- Admin kirgandan keyin parolni o'zgartira oladi.
- Admin panelda korxona qo'shilganda HR uchun login, parol va login link avtomatik chiqadi.
- Korxona kartasida **HR link** tugmasi bor: HR parolini reset qilib yangi link/parol chiqaradi.
- HR xodim qo'shganda xodim uchun login, parol va login link avtomatik chiqadi.
- Agar xodim qo'shishda login/parol bo'sh qoldirilsa, tizim o'zi yaratadi.
- `tenant_id` qo'shildi: HR yaratgan xodim shu kompaniyaga bog'lanadi.
- Backend auth/session va panel access himoyasi saqlangan.

## Render Environment Variables

```env
DATABASE_URL=Render PostgreSQL Internal Database URL
NODE_VERSION=22
AUTH_SECRET=kamida-32-belgili-random-secret
SEED_TOKEN=ixtiyoriy-seed-token
```

`AUTH_SECRET` uchun random qiymat:

```bash
openssl rand -base64 32
```

## Render Build/Start command

Build Command:

```bash
npm install && npx drizzle-kit push --dialect=postgresql --schema=./src/db/schema.ts --url "$DATABASE_URL" && npm run build
```

Start Command:

```bash
npm run start
```

`drizzle-kit push` yangi columnlarni database'ga qo'shadi: `tenant_id`, `login`, `password_hash`, `password_changed_at`, `panel_access` va boshqalar.

## Deploydan keyin

1. Render'da **Manual Deploy → Deploy latest commit** qiling.
2. `/login` ga kiring.
3. Admin bilan kiring:

```text
login: admin
parol: admin123
```

4. Sidebar pastidan **Parolni o'zgartirish** orqali admin parolni o'zgartiring.
5. `/superadmin/tenants` sahifasida korxona qo'shing — HR link/parol chiqadi.
6. HR shu link orqali kiradi va `/employees` sahifasidan xodim qo'shadi — xodim link/parol chiqadi.

## Tekshiruv natijalari

Quyidagilar muvaffaqiyatli ishladi:

```bash
npm run typecheck
npm run lint
npm run build
```
