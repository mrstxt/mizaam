# MIZAAM deploy va login tizimi

## Qo'shilgan asosiy funksiyalar

- Login/parol orqali kirish: `/login`
- HTTP-only cookie session, HMAC imzo, rol va panel ruxsatlari
- Admin / HR / Xodim rollari:
  - `admin` — barcha panellar
  - `manager` — UI'da HR sifatida ko'rsatiladi
  - `employee` — xodim paneli
- Admin/HR orqali xodim qo'shish va login-parol berish
- Xodimlarga panel ruxsatlarini checkbox orqali berish
- Chat, tasks, reports, attendance API'larida current user bo'yicha backend himoya
- Xodim delete o'rniga deaktiv qilinadi (`ishdan_ketgan`) — foreign key xatolar kamayadi
- `/403` ruxsat yo'q sahifasi
- Render deploy uchun `.env.example`

## Render Environment Variables

```env
DATABASE_URL=Render PostgreSQL Internal Database URL
NODE_VERSION=22
AUTH_SECRET=kamida-32-belgili-random-secret
SEED_TOKEN=ixtiyoriy-seed-token
```

`AUTH_SECRET` uchun lokalda quyidagicha random qiymat oling:

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

## Birinchi ishga tushirish

Deploydan keyin database seed qilish:

Agar `SEED_TOKEN` qo'ymagan bo'lsangiz:

```text
https://SIZNING-DOMAIN/api/seed
```

Agar `SEED_TOKEN` qo'ygan bo'lsangiz:

```text
https://SIZNING-DOMAIN/api/seed?token=SEED_TOKEN_QIYMATI
```

Seed demo loginlari:

```text
Admin: admin / Admin12345!
HR: hr / Hr12345!
Xodim: xodim / Xodim12345!
```

## Tekshiruv natijalari

Quyidagilar muvaffaqiyatli ishladi:

```bash
npm run typecheck
npm run lint
npm run build
```
