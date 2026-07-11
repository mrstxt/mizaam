# MIZAAM deploy va login struktura

## Yakuniy login/rol struktura

### 1) Platform admin

Admin faqat platforma admin panelga kiradi. Admin uchun korxona/HR paneli ochilmaydi.

```text
/login
login: admin
parol: admin123
```

Admin login qilganda avtomatik `/superadmin` ga kiradi. Agar admin `/`, `/employees`, `/tasks` kabi korxona panellariga o'tmoqchi bo'lsa, tizim uni yana `/superadmin` ga qaytaradi.

Admin sidebar pastidan **Parolni o'zgartirish** orqali parolini almashtira oladi. Admin parol o'zgartirilgandan keyin `admin123` qayta ishlamaydi.

### 2) Admin kompaniya qo'shadi

Admin `/superadmin/tenants` sahifasidan kompaniya qo'shadi.

Kompaniya qo'shishda HR login va HR parol **majburiy**:

```text
HR login
HR parol
```

Kompaniya saqlangandan keyin tizim admin uchun HR kirish ma'lumotlarini chiqaradi:

```text
HR link
HR login
HR parol
```

Admin shu ma'lumotlarni kompaniya HR'iga yuboradi.

### 3) HR katta korxona paneliga kiradi

HR admin bergan link/login/parol bilan kiradi va korxona katta panelini ko'radi:

- dashboard
- xodimlar
- davomat
- vazifalar
- hisobotlar
- moliya
- oylik
- analitika
- qoidalar
- CRM
- marketing
- integratsiyalar
- chat
- support
- bildirishnomalar

HR platform admin paneliga kira olmaydi.

### 4) HR xodim qo'shadi

HR `/employees` sahifasidan xodim qo'shadi. Xodim qo'shilgandan keyin tizim chiqaradi:

```text
Xodim link
Xodim login
Xodim parol
```

Agar HR login/parol maydonlarini bo'sh qoldirsa, tizim xodim uchun avtomatik login/parol yaratadi.

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

`drizzle-kit push` database'ga yangi columnlarni qo'shadi: `tenant_id`, `login`, `password_hash`, `password_changed_at`, `panel_access` va boshqalar.

## Tekshiruv natijalari

Quyidagilar muvaffaqiyatli ishladi:

```bash
npm run typecheck
npm run lint
npm run build
```
