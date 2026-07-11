import { db } from "@/db";
import {
  positions,
  users,
  attendance,
  tasks,
  dailyReports,
  finances,
  salaryDistributions,
  rules,
  notifications,
  chatMessages,
  supportTickets,
  activityLogs,
  leads,
  leadNotes,
  lostReasons,
  integrations,
  marketingRules,
  tenants,
  billingPayments,
  platformUpdates,
  platformMetrics,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { DEFAULT_PANELS_BY_ROLE, serializePanels, type UserRole } from "@/lib/permissions";

const defaultCredentials: Record<string, { login: string; password: string; role: UserRole }> = {
  "alisher@mizaam.uz": { login: "admin", password: "admin123", role: "admin" },
  "dilshod@mizaam.uz": { login: "hr", password: "Hr12345!", role: "manager" },
  "gulnora@mizaam.uz": { login: "xodim", password: "Xodim12345!", role: "employee" },
  "botir@mizaam.uz": { login: "botir", password: "Xodim12345!", role: "employee" },
  "madina@mizaam.uz": { login: "madina.hr", password: "Hr12345!", role: "manager" },
  "javlon@mizaam.uz": { login: "javlon", password: "Xodim12345!", role: "employee" },
  "zarina@mizaam.uz": { login: "zarina", password: "Xodim12345!", role: "employee" },
};

async function authFields(email: string) {
  const account = defaultCredentials[email];
  if (!account) return {};
  return {
    login: account.login,
    passwordHash: await hashPassword(account.password),
    mustChangePassword: false,
    panelAccess: serializePanels(DEFAULT_PANELS_BY_ROLE[account.role]),
  };
}

async function ensureDefaultAuthAccounts() {
  for (const [email, account] of Object.entries(defaultCredentials)) {
    const [existing] = await db
      .select({ id: users.id, login: users.login, passwordHash: users.passwordHash, panelAccess: users.panelAccess, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existing) continue;

    const updates: Partial<typeof users.$inferInsert> = {};
    if (!existing.login) updates.login = account.login;
    if (!existing.passwordHash) updates.passwordHash = await hashPassword(account.password);
    if (!existing.panelAccess) updates.panelAccess = serializePanels(DEFAULT_PANELS_BY_ROLE[account.role]);
    if (existing.role !== account.role) updates.role = account.role;

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, existing.id));
    }
  }
}

export async function seed() {
  // Check if superadmin already seeded
  const existingTenants = await db.select({ count: sql<number>`count(*)` }).from(tenants);
  if (Number(existingTenants[0].count) === 0) {
    // Seed Tenants (Korxonalar)
    const [t1, t2, t3, t4, t5, t6] = await db
      .insert(tenants)
      .values([
        {
          name: "Orient Logistics MChJ",
          domainPrefix: "orient",
          plan: "premium",
          status: "active",
          hasFaceIdModule: true,
          hasCrmModule: true,
          employeeCount: 42,
          maxEmployees: 100,
          monthlyFee: 3500000,
          contactName: "Azizbek Tursunov",
          contactPhone: "+998901112233",
          contactEmail: "info@orientlogistics.uz",
          expiresAt: new Date(Date.now() + 60 * 86400000),
        },
        {
          name: "Silk Road IT Solutions",
          domainPrefix: "silkroad",
          plan: "pro",
          status: "active",
          hasFaceIdModule: false,
          hasCrmModule: true,
          employeeCount: 24,
          maxEmployees: 50,
          monthlyFee: 1800000,
          contactName: "Nodirbek Salimov",
          contactPhone: "+998934445566",
          contactEmail: "ceo@silkroad.uz",
          expiresAt: new Date(Date.now() + 45 * 86400000),
        },
        {
          name: "Atlas Retail Group",
          domainPrefix: "atlas",
          plan: "enterprise",
          status: "active",
          hasFaceIdModule: true,
          hasCrmModule: true,
          employeeCount: 180,
          maxEmployees: 500,
          monthlyFee: 8000000,
          contactName: "Jamshid Qodirov",
          contactPhone: "+998977778899",
          contactEmail: "hr@atlasgroup.uz",
          expiresAt: new Date(Date.now() + 180 * 86400000),
        },
        {
          name: "Eco Build Construction",
          domainPrefix: "ecobuild",
          plan: "trial",
          status: "trial",
          hasFaceIdModule: false,
          hasCrmModule: true,
          employeeCount: 12,
          maxEmployees: 15,
          monthlyFee: 0,
          contactName: "Sardor Ahmedov",
          contactPhone: "+998909998877",
          contactEmail: "info@ecobuild.uz",
          expiresAt: new Date(Date.now() + 14 * 86400000),
        },
        {
          name: "MedPlus Xususiy Shifoxonasi",
          domainPrefix: "medplus",
          plan: "pro",
          status: "active",
          hasFaceIdModule: true,
          hasCrmModule: false,
          employeeCount: 35,
          maxEmployees: 50,
          monthlyFee: 2300000,
          contactName: "Gulchehra Aliyeva",
          contactPhone: "+998951234567",
          contactEmail: "admin@medplus.uz",
          expiresAt: new Date(Date.now() + 25 * 86400000),
        },
        {
          name: "Prime Agency LLC",
          domainPrefix: "prime",
          plan: "free",
          status: "suspended",
          hasFaceIdModule: false,
          hasCrmModule: false,
          employeeCount: 8,
          maxEmployees: 10,
          monthlyFee: 0,
          contactName: "Bobur Zokirov",
          contactPhone: "+998998887766",
          contactEmail: "team@primeagency.uz",
          expiresAt: new Date(Date.now() - 5 * 86400000),
        },
      ])
      .returning();

    // Seed Billing Payments
    await db.insert(billingPayments).values([
      { tenantId: t1.id, amount: 3500000, plan: "Premium + Face ID", paymentMethod: "payme", status: "paid", invoiceNumber: "INV-2026-0101", paidAt: new Date(Date.now() - 2 * 86400000) },
      { tenantId: t3.id, amount: 8000000, plan: "Enterprise + All Modules", paymentMethod: "bank_transfer", status: "paid", invoiceNumber: "INV-2026-0102", paidAt: new Date(Date.now() - 5 * 86400000) },
      { tenantId: t2.id, amount: 1800000, plan: "Pro SaaS", paymentMethod: "click", status: "paid", invoiceNumber: "INV-2026-0103", paidAt: new Date(Date.now() - 10 * 86400000) },
      { tenantId: t5.id, amount: 2300000, plan: "Pro + Face ID", paymentMethod: "payme", status: "paid", invoiceNumber: "INV-2026-0104", paidAt: new Date(Date.now() - 15 * 86400000) },
      { tenantId: t1.id, amount: 3500000, plan: "Premium + Face ID (December)", paymentMethod: "payme", status: "paid", invoiceNumber: "INV-2025-1201", paidAt: new Date(Date.now() - 32 * 86400000) },
      { tenantId: t2.id, amount: 1800000, plan: "Pro SaaS (Pending renewal)", paymentMethod: "click", status: "pending", invoiceNumber: "INV-2026-0201" },
    ]);

    // Seed Platform Updates
    await db.insert(platformUpdates).values([
      {
        version: "v1.3.0",
        title: "⭐ Computer Vision: Face ID Davomat Moduli rasman ishga tushdi!",
        content: "Yuz embeddingi asosida avtomatik davomat qayd etish tizimi va reception uchun anonim tashrif hisoblagichi barcha Premium korxonalar uchun yoqildi.",
        type: "module",
        isPublished: true,
        publishedAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        version: "v1.2.5",
        title: "🎯 CRM Voronka va Telegram Bot sinxronizatsiyasi tezlashtirildi",
        content: "Lidlar SLA ogohlantirishlari va konversiya foizi tahlilida real vaqt sinxron funksiyalari yangilandi.",
        type: "feature",
        isPublished: true,
        publishedAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        version: "v1.2.0",
        title: "🛡️ O'zbekiston davlat reyestri huquqiy muvofiqligi va shifrlash",
        content: "Barcha xodimlar bazasi va nozik ma'lumotlar (bot login/parol, karta raqamlari) AES-256 shifrlash asosida saqlana boshladi.",
        type: "security",
        isPublished: true,
        publishedAt: new Date(Date.now() - 15 * 86400000),
      },
      {
        version: "v1.4.0-beta",
        title: "🔮 SOP va Kaizen yaxshilanish takliflari moduli tayyorlanmoqda",
        content: "Lavozimlar bo'yicha standart ish jarayonlari (SOP) va xodimlardan takliflar yig'ish (Kaizen) moduli keyingi oy yuboriladi.",
        type: "feature",
        isPublished: false,
      },
    ]);

    // Seed Platform Metrics
    await db.insert(platformMetrics).values({
      cpuUsage: 18.4,
      ramUsage: 42.1,
      dbSizeMb: 256.8,
      activeBotsCount: 18,
      totalApiRequests: 384590,
    });
  }

  // Check if users already seeded
  const existing = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(existing[0].count) > 0) {
    await ensureDefaultAuthAccounts();
    return;
  }

  // Lost reasons
  await db.insert(lostReasons).values([
    { reason: "Narx qimmat" },
    { reason: "Vaqt yetishmadi" },
    { reason: "Ishonchsizlik" },
    { reason: "Mahsulot mos kelmadi" },
    { reason: "Raqobatchiga ketdi" },
  ]);

  // Positions
  const [pos1, pos2, pos3, pos4, pos5] = await db
    .insert(positions)
    .values([
      { name: "Direktor", baseSalary: 8000000, salaryType: "oylik" },
      { name: "Menejer", baseSalary: 5000000, salaryType: "kpi" },
      { name: "Sotuv menejeri", baseSalary: 3500000, salaryType: "sotuv_bonusi" },
      { name: "Buxgalter", baseSalary: 4500000, salaryType: "oylik" },
      { name: "Ofis menejeri", baseSalary: 3000000, salaryType: "oylik" },
    ])
    .returning();

  // Users
  const [u1, u2, u3, u4, u5, u6, u7] = await db
    .insert(users)
    .values([
      {
        firstName: "Alisher",
        lastName: "Karimov",
        positionId: pos1.id,
        email: "alisher@mizaam.uz",
        ...(await authFields("alisher@mizaam.uz")),
        phone: "+998901234567",
        address: "Toshkent, Yunusobod",
        education: "Toshkent Davlat Universiteti",
        cardNumber: "8600123456789012",
        telegramLogin: "@alisher_k",
        telegramPassword: "pass123",
        status: "ishlaydi",
        role: "admin",
      },
      {
        firstName: "Dilshod",
        lastName: "Rahimov",
        positionId: pos2.id,
        email: "dilshod@mizaam.uz",
        ...(await authFields("dilshod@mizaam.uz")),
        phone: "+998901234568",
        address: "Toshkent, Chilonzor",
        education: "Toshkent Moliya Instituti",
        cardNumber: "8600123456789013",
        telegramLogin: "@dilshod_r",
        telegramPassword: "pass123",
        status: "ishlaydi",
        role: "manager",
      },
      {
        firstName: "Gulnora",
        lastName: "Azizova",
        positionId: pos3.id,
        email: "gulnora@mizaam.uz",
        ...(await authFields("gulnora@mizaam.uz")),
        phone: "+998901234569",
        address: "Toshkent, Mirzo Ulug'bek",
        education: "Westminster Universiteti",
        cardNumber: "8600123456789014",
        telegramLogin: "@gulnora_a",
        telegramPassword: "pass123",
        status: "ishlaydi",
        role: "employee",
      },
      {
        firstName: "Botir",
        lastName: "Nurmatov",
        positionId: pos3.id,
        email: "botir@mizaam.uz",
        ...(await authFields("botir@mizaam.uz")),
        phone: "+998901234570",
        address: "Toshkent, Sergeli",
        education: "Toshkent Axborot Texnologiyalari",
        cardNumber: "8600123456789015",
        telegramLogin: "@botir_n",
        telegramPassword: "pass123",
        status: "ishlaydi",
        role: "employee",
      },
      {
        firstName: "Madina",
        lastName: "Saidova",
        positionId: pos4.id,
        email: "madina@mizaam.uz",
        ...(await authFields("madina@mizaam.uz")),
        phone: "+998901234571",
        address: "Toshkent, Yakkasaroy",
        education: "Toshkent Iqtisodiyot Universiteti",
        cardNumber: "8600123456789016",
        telegramLogin: "@madina_s",
        telegramPassword: "pass123",
        status: "ishlaydi",
        role: "manager",
      },
      {
        firstName: "Javlon",
        lastName: "Tursunov",
        positionId: pos5.id,
        email: "javlon@mizaam.uz",
        ...(await authFields("javlon@mizaam.uz")),
        phone: "+998901234572",
        address: "Toshkent, Olmazor",
        education: "Toshkent Davlat Universiteti",
        cardNumber: "8600123456789017",
        telegramLogin: "@javlon_t",
        telegramPassword: "pass123",
        status: "ishlaydi",
        role: "employee",
      },
      {
        firstName: "Zarina",
        lastName: "Xolmurodova",
        positionId: pos3.id,
        email: "zarina@mizaam.uz",
        ...(await authFields("zarina@mizaam.uz")),
        phone: "+998901234573",
        address: "Toshkent, Shayxontohur",
        education: "MDIS Toshkent",
        cardNumber: "8600123456789018",
        telegramLogin: "@zarina_x",
        telegramPassword: "pass123",
        status: "damda",
        role: "employee",
      },
    ])
    .returning();

  const allUsers = [u1, u2, u3, u4, u5, u6, u7];

  // Attendance (last 7 days)
  const today = new Date();
  for (let d = 6; d >= 0; d--) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    const dateStr = dt.toISOString().split("T")[0];

    for (let i = 0; i < 6; i++) {
      const user = allUsers[i];
      const hour = 8 + Math.floor(Math.random() * 3);
      const min = Math.floor(Math.random() * 60);
      const checkIn = new Date(dt);
      checkIn.setHours(hour, min, 0);

      const checkOut = new Date(dt);
      checkOut.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0);

      const status = hour > 9 ? "kechikdi" : "keldi";

      await db.insert(attendance).values({
        userId: user.id,
        date: dateStr,
        checkIn,
        checkOut,
        status: status as "keldi" | "kechikdi" | "kelmadi",
      });
    }
    // One absent
    await db.insert(attendance).values({
      userId: allUsers[5].id,
      date: dateStr,
      status: "kelmadi",
      reason: d % 3 === 0 ? "Kasallik" : null,
    });
  }

  // Tasks
  await db.insert(tasks).values([
    {
      title: "Yanvar oyi hisobotini tayyorlash",
      description: "Barcha bo'limlar bo'yicha yanvar oyi moliyaviy hisobotini tayyorlash",
      assignedTo: u5.id,
      createdBy: u1.id,
      priority: "yuqori",
      status: "bajarilmoqda",
      deadline: new Date(Date.now() + 3 * 86400000),
      bonus: 500000,
    },
    {
      title: "Yangi mijozlar bilan shartnoma imzolash",
      description: "ABC MChJ va XYZ Kompaniyasi bilan shartnomalarni tayyorlash",
      assignedTo: u3.id,
      createdBy: u2.id,
      priority: "kritik",
      status: "kutilmoqda",
      deadline: new Date(Date.now() + 2 * 86400000),
      bonus: 300000,
    },
    {
      title: "Ofis jihozlarini yangilash",
      description: "Kompyuter va printerlarni yangilash bo'yicha taklif tayyorlash",
      assignedTo: u6.id,
      createdBy: u1.id,
      priority: "orta",
      status: "bajarildi",
      deadline: new Date(Date.now() - 1 * 86400000),
      bonus: 200000,
      completedAt: new Date(),
    },
    {
      title: "Marketing rejasini ishlab chiqish",
      description: "2-chorak uchun marketing strategiyasi",
      assignedTo: u4.id,
      createdBy: u2.id,
      priority: "yuqori",
      status: "muddati_otgan",
      deadline: new Date(Date.now() - 2 * 86400000),
      bonus: 400000,
    },
    {
      title: "Xodimlar uchun trening tashkil qilish",
      description: "Sotuv ko'nikmalari bo'yicha 2 kunlik trening",
      assignedTo: u6.id,
      createdBy: u1.id,
      priority: "past",
      status: "kutilmoqda",
      deadline: new Date(Date.now() + 7 * 86400000),
      bonus: 150000,
    },
  ]);

  // Daily reports
  for (let d = 3; d >= 0; d--) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    const dateStr = dt.toISOString().split("T")[0];

    for (let i = 2; i < 5; i++) {
      const statuses: ("kutilmoqda" | "tasdiqlangan" | "rad_etilgan")[] = [
        "tasdiqlangan",
        "kutilmoqda",
        "rad_etilgan",
      ];
      const st = d === 0 ? "kutilmoqda" : statuses[(i + d) % 3];
      await db.insert(dailyReports).values({
        userId: allUsers[i].id,
        date: dateStr,
        content: `Bugun ${2 + i} ta mijoz bilan gaplashdim. ${i + 1} ta shartnoma tayyorlandi. Ertaga yana davom etamiz.`,
        status: st,
        rejectionReason: st === "rad_etilgan" ? "Hisobot to'liq emas" : null,
      });
    }
  }

  // Finances
  const financeCategories = [
    { type: "daromad" as const, category: "Xizmat daromadi", amount: 25000000, description: "ABC MChJ shartnomasi" },
    { type: "daromad" as const, category: "Xizmat daromadi", amount: 18000000, description: "XYZ Kompaniyasi" },
    { type: "xarajat" as const, category: "Kommunal to'lovlar", amount: 1500000, description: "Elektr, suv, gaz" },
    { type: "xarajat" as const, category: "Ofis arendasi", amount: 5000000, description: "Yanvar oyi" },
    { type: "xarajat" as const, category: "Marketing", amount: 3000000, description: "Reklama kampaniyasi" },
    { type: "xarajat" as const, category: "Qo'shimcha xarajatlar", amount: 800000, description: "Kanselyariya" },
  ];

  for (const fc of financeCategories) {
    await db.insert(finances).values({
      ...fc,
      date: today.toISOString().split("T")[0],
    });
  }

  // Salary distributions
  for (const user of allUsers.slice(0, 6)) {
    const pos = [pos1, pos2, pos3, pos3, pos4, pos5][allUsers.indexOf(user)];
    const kpi = Math.floor(Math.random() * 100);
    await db.insert(salaryDistributions).values({
      userId: user.id,
      month: "2026-01",
      baseSalary: Number(pos.baseSalary),
      bonus: Math.floor(Math.random() * 1000000),
      kpiBonus: Math.floor(kpi * 10000),
      fine: Math.floor(Math.random() * 200000),
      total: Number(pos.baseSalary) + Math.floor(Math.random() * 1500000),
      cardNumber: user.cardNumber,
    });
  }

  // Rules
  await db.insert(rules).values([
    {
      name: "Kechikish jarimasi",
      ruleType: "late_fine",
      value: 50000,
      description: "Har bir kechikish uchun jarima",
      workStartTime: "09:00",
      workEndTime: "18:00",
      gracePeriodMinutes: 15,
      warningLimit: 3,
      attendanceFine: 50000,
    },
    {
      name: "Vazifa kechiktirish jarimasi",
      ruleType: "task_delay_fine",
      value: 100000,
      description: "Muddatidan kechikkan vazifa uchun jarima",
      taskDelayFine: 100000,
    },
    {
      name: "KPI maksimal chegarasi",
      ruleType: "kpi_max",
      value: 100,
      description: "Maksimal KPI ko'rsatkichi",
      kpiMax: 100,
    },
    {
      name: "Erta tugatish bonusi",
      ruleType: "early_bonus",
      value: 200000,
      description: "Vazifani muddatidan oldin bajarish uchun bonus",
      earlyBonus: 200000,
    },
  ]);

  // Notifications
  await db.insert(notifications).values([
    {
      title: "KPI ko'rsatkichi past",
      message: "Botir Nurmatovning KPI ko'rsatkichi 40% dan past",
      type: "ogohlantirish",
      status: "kutilmoqda",
    },
    {
      title: "Yangi vazifa",
      message: "Sizga yangi vazifa biriktirildi: Yanvar oyi hisoboti",
      type: "info",
      status: "yuborildi",
      sentAt: new Date(),
      targetUserId: u5.id,
    },
    {
      title: "Hisobot rad etildi",
      message: "Sizning kunlik hisobotingiz rad etildi",
      type: "signal",
      status: "rejalashtirilgan",
      scheduledFor: new Date(Date.now() + 86400000),
    },
  ]);

  // Chat messages
  await db.insert(chatMessages).values([
    { senderId: u1.id, receiverId: u2.id, message: "Dilshod, bugungi hisobotlar tayyormi?", isRead: true },
    { senderId: u2.id, receiverId: u1.id, message: "Ha, Alisher aka. Hammasi tayyor.", isRead: true },
    { senderId: u1.id, receiverId: u2.id, message: "Zo'r, rahmat!", isRead: false },
    { senderId: u3.id, receiverId: u2.id, message: "Mijoz bilan uchrashuv 14:00 da", isRead: true },
    { senderId: u4.id, receiverId: u6.id, message: "Ofis uchun qog'oz kerakmi?", isRead: false },
  ]);

  // Support tickets
  await db.insert(supportTickets).values([
    {
      userId: u3.id,
      subject: "Tizimga kira olmayapman",
      message: "Parolni unutganman, yangilab bering",
      status: "ochiq",
    },
    {
      userId: u6.id,
      subject: "Hisobot yuborishda xatolik",
      message: "Kunlik hisobot yuborishda server xatosi chiqmoqda",
      status: "jarayonda",
      response: "Muammo o'rganilmoqda",
    },
  ]);

  // Activity logs
  const actions = [
    "Hisobot tasdiqlandi",
    "Yangi vazifa yaratildi",
    "Davomat belgilandi",
    "Xodim ma'lumoti yangilandi",
    "Yangi lid qo'shildi",
    "Mijoz bilan bog'lanildi",
    "Shartnoma imzolandi",
  ];
  for (let i = 0; i < 15; i++) {
    const user = allUsers[Math.floor(Math.random() * 7)];
    const dt = new Date(today);
    dt.setHours(dt.getHours() - i);
    await db.insert(activityLogs).values({
      userId: user.id,
      action: actions[i % actions.length],
      details: `${user.firstName} ${user.lastName} tomonidan amalga oshirildi`,
      createdAt: dt,
    });
  }

  // Leads (CRM)
  const [lead1, lead2, lead3, lead4, lead5, lead6, lead7] = await db
    .insert(leads)
    .values([
      {
        name: "Sarvar Odilov",
        phone: "+998931234567",
        source: "telegram",
        assignedTo: u3.id,
        stage: "muzokara",
        slaDeadline: new Date(Date.now() + 3600000),
        createdAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        name: "Nilufar Karimova",
        phone: "+998931234568",
        source: "sayt",
        assignedTo: u4.id,
        stage: "golib",
        wonAmount: 12000000,
        wonAt: new Date(Date.now() - 2 * 86400000),
        slaDeadline: new Date(Date.now() + 7200000),
        createdAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        name: "Aziz Toshmatov",
        phone: "+998931234569",
        source: "qolda",
        assignedTo: u3.id,
        stage: "yangi_lid",
        slaDeadline: new Date(Date.now() + 1800000),
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        name: "Dilfuza Anvarova",
        phone: "+998931234570",
        source: "telegram",
        assignedTo: u4.id,
        stage: "yutqazilgan",
        lostReason: "Narx qimmat",
        lostAt: new Date(Date.now() - 4 * 86400000),
        createdAt: new Date(Date.now() - 14 * 86400000),
      },
      {
        name: "Komron Saidov",
        phone: "+998931234571",
        source: "sayt",
        assignedTo: u3.id,
        stage: "boglanildi",
        slaDeadline: new Date(Date.now() + 5400000),
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        name: "Malika Tursunova",
        phone: "+998931234572",
        source: "instagram",
        assignedTo: u4.id,
        stage: "taklif_yuborildi",
        slaDeadline: new Date(Date.now() + 14400000),
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        name: "Bobur Aliyev",
        phone: "+998931234573",
        source: "whatsapp",
        assignedTo: u3.id,
        stage: "qiziqish_bildirdi",
        slaDeadline: new Date(Date.now() + 3600000),
        createdAt: new Date(Date.now() - 6 * 86400000),
      },
    ])
    .returning();

  // Lead notes
  await db.insert(leadNotes).values([
    { leadId: lead1.id, userId: u3.id, content: "Mijoz juda qiziqmoqda, narxni tushuntirdim" },
    { leadId: lead1.id, userId: u2.id, content: "Keyingi qo'ng'iroqda chegirma taklif qiling" },
    { leadId: lead2.id, userId: u4.id, content: "Shartnoma imzolandi, to'lov kutilmoqda" },
    { leadId: lead4.id, userId: u4.id, content: "Raqobatchi arzonroq narx taklif qildi" },
    { leadId: lead5.id, userId: u3.id, content: "Birinchi qo'ng'iroq amalga oshirildi, qiziqish bildirdi" },
  ]);

  // Integrations
  await db.insert(integrations).values([
    { name: "Telegram Bot", type: "telegram", config: '{"token":"BOT_TOKEN"}', enabled: true },
    { name: "Sayt Forma", type: "website", config: '{"endpoint":"/api/leads/webhook"}', enabled: true },
    { name: "WhatsApp Business", type: "whatsapp", config: "{}", enabled: false },
    { name: "Instagram", type: "instagram", config: "{}", enabled: false },
  ]);

  // Marketing rules
  await db.insert(marketingRules).values([
    {
      name: "Yangi lidga avtomatik salomlashish",
      triggerEvent: "new_lead",
      action: "send_greeting",
      config: '{"message":"Assalomu alaykum! Siz bilan tez orada bog\'lanamiz."}',
      enabled: true,
    },
    {
      name: "Harakatsiz lid eslatmasi",
      triggerEvent: "inactive_lead",
      action: "notify_manager",
      config: '{"days":3}',
      enabled: true,
    },
    {
      name: "Bitim tasdiqlash xabari",
      triggerEvent: "deal_won",
      action: "send_confirmation",
      config: '{"message":"Shartnoma muvaffaqiyatli yakunlandi!"}',
      enabled: true,
    },
  ]);

  console.log("✅ Seed completed successfully!");
}
