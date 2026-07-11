import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============ ENUMS ============

export const userStatusEnum = pgEnum("user_status", [
  "ishlaydi",
  "ishdan_ketgan",
  "damda",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "employee",
]);

export const salaryTypeEnum = pgEnum("salary_type", [
  "oylik",
  "kpi",
  "sotuv_bonusi",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "keldi",
  "kechikdi",
  "kelmadi",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "past",
  "orta",
  "yuqori",
  "kritik",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "kutilmoqda",
  "bajarilmoqda",
  "bajarildi",
  "muddati_otgan",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "kutilmoqda",
  "tasdiqlangan",
  "rad_etilgan",
]);

export const financeTypeEnum = pgEnum("finance_type", [
  "daromad",
  "xarajat",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "info",
  "ogohlantirish",
  "signal",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "kutilmoqda",
  "yuborildi",
  "rejalashtirilgan",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "ochiq",
  "jarayonda",
  "hal_qilindi",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "telegram",
  "sayt",
  "qolda",
  "whatsapp",
  "instagram",
  "facebook",
]);

export const leadStageEnum = pgEnum("lead_stage_type", [
  "yangi_lid",
  "boglanildi",
  "qiziqish_bildirdi",
  "taklif_yuborildi",
  "muzokara",
  "golib",
  "yutqazilgan",
]);

export const tenantPlanEnum = pgEnum("tenant_plan", [
  "trial",
  "free",
  "pro",
  "premium",
  "enterprise",
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "trial",
  "suspended",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "payme",
  "click",
  "bank_transfer",
  "cash",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "pending",
  "failed",
]);

// ============ TABLES ============

// Lavozimlar
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseSalary: real("base_salary").default(0),
  salaryType: salaryTypeEnum("salary_type").default("oylik"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Xodimlar
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  positionId: integer("position_id").references(() => positions.id),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  education: text("education"),
  cardNumber: text("card_number"),
  telegramLogin: text("telegram_login"),
  telegramPassword: text("telegram_password"),
  status: userStatusEnum("status").default("ishlaydi"),
  role: userRoleEnum("role").default("employee"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Davomat
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  status: attendanceStatusEnum("status").default("keldi"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vazifalar
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to")
    .references(() => users.id)
    .notNull(),
  createdBy: integer("created_by").references(() => users.id),
  priority: taskPriorityEnum("priority").default("orta"),
  status: taskStatusEnum("status").default("kutilmoqda"),
  deadline: timestamp("deadline"),
  bonus: real("bonus").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Kunlik hisobotlar
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  content: text("content").notNull(),
  status: reportStatusEnum("status").default("kutilmoqda"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Moliyaviy
export const finances = pgTable("finances", {
  id: serial("id").primaryKey(),
  type: financeTypeEnum("type").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Oylik tarqatish
export const salaryDistributions = pgTable("salary_distributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  month: text("month").notNull(),
  baseSalary: real("base_salary").default(0),
  bonus: real("bonus").default(0),
  kpiBonus: real("kpi_bonus").default(0),
  fine: real("fine").default(0),
  total: real("total").default(0),
  cardNumber: text("card_number"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Qoidalar
export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(),
  value: real("value").default(0),
  description: text("description"),
  // Ish vaqti sozlamalari
  workStartTime: text("work_start_time").default("09:00"),
  workEndTime: text("work_end_time").default("18:00"),
  gracePeriodMinutes: integer("grace_period_minutes").default(15),
  warningLimit: integer("warning_limit").default(3),
  attendanceFine: real("attendance_fine").default(0),
  taskDelayFine: real("task_delay_fine").default(0),
  kpiMax: real("kpi_max").default(100),
  earlyBonus: real("early_bonus").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bildirishnomalar
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").default("info"),
  status: notificationStatusEnum("status").default("kutilmoqda"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  targetUserId: integer("target_user_id").references(() => users.id),
  targetRole: userRoleEnum("target_role"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  receiverId: integer("receiver_id")
    .references(() => users.id)
    .notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").default("ochiq"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Faoliyatlar jurnali
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lidlar (CRM)
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  source: leadSourceEnum("source").default("qolda"),
  assignedTo: integer("assigned_to").references(() => users.id),
  stage: leadStageEnum("stage").default("yangi_lid"),
  isDuplicateOf: integer("is_duplicate_of"),
  slaDeadline: timestamp("sla_deadline"),
  lostReason: text("lost_reason"),
  wonAmount: real("won_amount").default(0),
  wonAt: timestamp("won_at"),
  lostAt: timestamp("lost_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lid izohlari
export const leadNotes = pgTable("lead_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .references(() => leads.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Yo'qotilgan sabablari
export const lostReasons = pgTable("lost_reasons", {
  id: serial("id").primaryKey(),
  reason: text("reason").notNull(),
});

// Integratsiyalar
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  config: text("config"),
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing avtomatizatsiyasi
export const marketingRules = pgTable("marketing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  triggerEvent: text("trigger_event").notNull(),
  action: text("action").notNull(),
  config: text("config"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ SUPERADMIN (PLATFORM ENGINE) TABLES ============

// Korxonalar (Tenants)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domainPrefix: text("domain_prefix").notNull(),
  plan: tenantPlanEnum("plan").default("trial"),
  status: tenantStatusEnum("status").default("active"),
  hasFaceIdModule: boolean("has_face_id_module").default(false),
  hasCrmModule: boolean("has_crm_module").default(true),
  employeeCount: integer("employee_count").default(0),
  maxEmployees: integer("max_employees").default(15),
  monthlyFee: real("monthly_fee").default(0),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// To'lovlar (Billing & Revenue)
export const billingPayments = pgTable("billing_payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  amount: real("amount").notNull(),
  plan: text("plan").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("payme"),
  status: paymentStatusEnum("status").default("paid"),
  invoiceNumber: text("invoice_number"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platforma yangiliklari (Release Notes / Broadcast)
export const platformUpdates = pgTable("platform_updates", {
  id: serial("id").primaryKey(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("feature"), // feature, fix, security, module
  isPublished: boolean("is_published").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Global Tizim Metrikalari (Server Health)
export const platformMetrics = pgTable("platform_metrics", {
  id: serial("id").primaryKey(),
  cpuUsage: real("cpu_usage").default(24.5),
  ramUsage: real("ram_usage").default(48.2),
  dbSizeMb: real("db_size_mb").default(128.4),
  activeBotsCount: integer("active_bots_count").default(12),
  totalApiRequests: integer("total_api_requests").default(148520),
  createdAt: timestamp("created_at").defaultNow(),
});
