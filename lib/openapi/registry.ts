/**
 * Sumber kebenaran dokumentasi OpenAPI (SRS §5.2.16).
 *
 * Dokumen ini ditulis manual (bukan hasil parsing anotasi) agar tipe dan
 * contoh respons tetap sinkron dengan DTO di `lib/dto`. Skrip
 * `scripts/generate-openapi.ts` menuliskannya ke `public/openapi.json`,
 * sedangkan `GET /api/docs` menyajikannya langsung.
 */

type Schema = Record<string, unknown>;

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const json = (schema: unknown) => ({
  "application/json": { schema },
});

const envelope = (data: Schema): Schema => ({
  type: "object",
  required: ["success", "data", "message", "errors", "code"],
  properties: {
    success: { type: "boolean" },
    data,
    message: { type: ["string", "null"] },
    errors: {
      type: ["object", "null"],
      additionalProperties: { type: "array", items: { type: "string" } },
    },
    code: { type: ["string", "null"] },
  },
});

const okRes = (description: string, data: Schema = { type: "null" }) => ({
  description,
  content: json(envelope(data)),
});

const errRes = (description: string) => ({
  description,
  content: json(ref("ErrorEnvelope")),
});

const E401 = errRes("Sesi tidak ada atau sudah berakhir.");
const E403 = errRes("Peran, kepemilikan, atau status akun tidak memenuhi syarat.");
const E404 = errRes("Resource tidak ditemukan atau tidak boleh dilihat.");
const E409 = errRes("Konflik status, duplikasi, atau jadwal tidak tersedia.");
const E422 = errRes("Validasi input gagal.");
const E429 = errRes("Batas laju permintaan terlampaui.");
const E500 = errRes("Kesalahan internal server.");
const E502 = errRes("Layanan eksternal gagal.");

const auth = [{ supabaseSession: [] }];

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
} as const;

const pageParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
  },
] as const;

const paginated = (item: Schema): Schema => ({
  type: "object",
  required: ["items", "page", "limit", "total", "totalPages"],
  properties: {
    items: { type: "array", items: item },
    page: { type: "integer" },
    limit: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
});

const schemas: Record<string, Schema> = {
  ErrorCode: {
    type: "string",
    enum: [
      "VALIDATION_ERROR",
      "UNAUTHENTICATED",
      "EMAIL_NOT_VERIFIED",
      "ACCOUNT_INACTIVE",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "SLOT_UNAVAILABLE",
      "BOOKING_NOT_PAYABLE",
      "PAYMENT_ALREADY_SUCCESS",
      "SESSION_NOT_ACTIVE",
      "RATE_LIMITED",
      "EXTERNAL_SERVICE_ERROR",
      "INTERNAL_ERROR",
    ],
  },
  ErrorEnvelope: {
    type: "object",
    required: ["success", "data", "message", "errors", "code"],
    properties: {
      success: { type: "boolean", enum: [false] },
      data: { type: "null" },
      message: { type: "string" },
      errors: {
        type: ["object", "null"],
        additionalProperties: { type: "array", items: { type: "string" } },
      },
      code: ref("ErrorCode"),
    },
  },
  UserSummary: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      fullName: { type: "string" },
      avatarUrl: { type: ["string", "null"], format: "uri" },
    },
  },
  Profile: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      fullName: { type: "string" },
      role: { type: "string", enum: ["patient", "counselor", "admin"] },
      avatarKey: { type: ["string", "null"] },
      avatarUrl: { type: ["string", "null"], format: "uri" },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      counselorProfile: {
        type: ["object", "null"],
        properties: {
          specialization: { type: "string" },
          bio: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  AdminUser: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      fullName: { type: "string" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["patient", "counselor", "admin"] },
      isActive: { type: "boolean" },
      avatarUrl: { type: ["string", "null"], format: "uri" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Service: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      description: { type: "string" },
      durationMinutes: { type: "integer" },
      price: { type: "number" },
      isActive: { type: "boolean" },
      methods: { type: "array", items: { type: "string", enum: ["chat", "zoom"] } },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Counselor: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      fullName: { type: "string" },
      avatarUrl: { type: ["string", "null"], format: "uri" },
      specialization: { type: ["string", "null"] },
      bio: { type: ["string", "null"] },
      services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
          },
        },
      },
    },
  },
  AdminCounselor: {
    allOf: [
      ref("Counselor"),
      {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    ],
  },
  TimeSlot: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      counselorId: { type: "string", format: "uuid" },
      startTime: { type: "string", format: "date-time" },
      endTime: { type: "string", format: "date-time" },
      status: { type: "string", enum: ["available", "held", "booked"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Booking: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      bookingCode: { type: "string", example: "RHT-261107-A1B2C3D4" },
      status: {
        type: "string",
        enum: ["pending_payment", "confirmed", "cancelled", "expired"],
      },
      method: { type: "string", enum: ["chat", "zoom"] },
      serviceId: { type: "string", format: "uuid" },
      serviceName: { type: "string" },
      durationMinutes: { type: "integer" },
      price: { type: "number" },
      scheduledStart: { type: "string", format: "date-time" },
      scheduledEnd: { type: "string", format: "date-time" },
      paymentExpiresAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      patient: ref("UserSummary"),
      counselor: ref("UserSummary"),
      payment: {
        type: ["object", "null"],
        properties: {
          id: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: ["pending", "success", "failed", "cancelled", "expired"],
          },
          grossAmount: { type: "number" },
          paymentType: { type: ["string", "null"] },
          transactionTime: { type: ["string", "null"], format: "date-time" },
          expiresAt: { type: ["string", "null"], format: "date-time" },
        },
      },
      session: {
        type: ["object", "null"],
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["scheduled", "active", "completed"] },
          startedAt: { type: ["string", "null"], format: "date-time" },
          endedAt: { type: ["string", "null"], format: "date-time" },
        },
      },
    },
  },
  Payment: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      midtransOrderId: { type: "string" },
      status: {
        type: "string",
        enum: ["pending", "success", "failed", "cancelled", "expired"],
      },
      grossAmount: { type: "number" },
      paymentType: { type: ["string", "null"] },
      transactionTime: { type: ["string", "null"], format: "date-time" },
      expiresAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      snapToken: { type: "string" },
      booking: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          bookingCode: { type: "string" },
          serviceName: { type: "string" },
          scheduledStart: { type: "string", format: "date-time" },
        },
      },
      patient: ref("UserSummary"),
    },
  },
  Session: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { type: "string", enum: ["scheduled", "active", "completed"] },
      startedAt: { type: ["string", "null"], format: "date-time" },
      endedAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      booking: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          bookingCode: { type: "string" },
          serviceName: { type: "string" },
          method: { type: "string", enum: ["chat", "zoom"] },
          durationMinutes: { type: "integer" },
          scheduledStart: { type: "string", format: "date-time" },
          scheduledEnd: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["pending_payment", "confirmed", "cancelled", "expired"],
          },
        },
      },
      patient: ref("UserSummary"),
      counselor: ref("UserSummary"),
      zoom: {
        type: ["object", "null"],
        description:
          "Admins only receive status fields; participants receive joinUrl; startUrl is counselor-only. joinUrl/startUrl are only populated from 10 minutes before the session until it ends.",
        properties: {
          status: { type: "string", enum: ["pending", "created", "failed"] },
          joinable: { type: "boolean" },
          opensAt: { type: "string", format: "date-time" },
          closesAt: { type: "string", format: "date-time" },
          joinUrl: { type: ["string", "null"], format: "uri" },
          startUrl: { type: ["string", "null"], format: "uri" },
          startTime: { type: "string", format: "date-time" },
          durationMinutes: { type: "integer" },
          attemptCount: { type: "integer" },
          lastError: { type: ["string", "null"] },
          hasJoinUrl: { type: "boolean" },
          hasStartUrl: { type: "boolean" },
        },
      },
      chat: {
        type: ["object", "null"],
        properties: {
          enabled: { type: "boolean" },
          readOnly: { type: "boolean" },
        },
      },
    },
  },
  ChatMessage: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      sessionId: { type: "string", format: "uuid" },
      senderId: { type: "string", format: "uuid" },
      content: { type: "string" },
      clientMessageId: { type: "string", format: "uuid" },
      createdAt: { type: "string", format: "date-time" },
      sender: ref("UserSummary"),
    },
  },
  AdminStats: {
    type: "object",
    properties: {
      services: {
        type: "object",
        properties: { total: { type: "integer" }, active: { type: "integer" } },
      },
      counselors: {
        type: "object",
        properties: { total: { type: "integer" }, active: { type: "integer" } },
      },
      patients: {
        type: "object",
        properties: { total: { type: "integer" } },
      },
      bookings: {
        type: "object",
        properties: {
          total: { type: "integer" },
          pendingPayment: { type: "integer" },
          confirmed: { type: "integer" },
          cancelled: { type: "integer" },
          expired: { type: "integer" },
        },
      },
      payments: {
        type: "object",
        properties: {
          total: { type: "integer" },
          pending: { type: "integer" },
          success: { type: "integer" },
          failed: { type: "integer" },
          cancelled: { type: "integer" },
          expired: { type: "integer" },
          revenue: { type: "number" },
        },
      },
      sessions: {
        type: "object",
        properties: {
          total: { type: "integer" },
          scheduled: { type: "integer" },
          active: { type: "integer" },
          completed: { type: "integer" },
        },
      },
      zoomMeetings: {
        type: "object",
        properties: {
          total: { type: "integer" },
          pending: { type: "integer" },
          created: { type: "integer" },
          failed: { type: "integer" },
        },
      },
    },
  },
  Health: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["ok", "degraded"] },
      database: { type: "string", enum: ["ok", "error"] },
      integrations: {
        type: "object",
        properties: {
          supabase: { type: "boolean" },
          serviceRole: { type: "boolean" },
          midtrans: { type: "boolean" },
          zoom: { type: "boolean" },
          resend: { type: "boolean" },
          r2: { type: "boolean" },
        },
      },
      latencyMs: { type: "integer" },
      timestamp: { type: "string", format: "date-time" },
    },
  },
  SignupInput: {
    type: "object",
    required: ["fullName", "email", "password", "confirmPassword"],
    properties: {
      fullName: { type: "string", minLength: 2, maxLength: 120 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      confirmPassword: { type: "string", minLength: 8 },
    },
  },
  LoginInput: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
  EmailInput: {
    type: "object",
    required: ["email"],
    properties: { email: { type: "string", format: "email" } },
  },
  ResetPasswordInput: {
    type: "object",
    required: ["password", "confirmPassword"],
    properties: {
      password: { type: "string", minLength: 8 },
      confirmPassword: { type: "string", minLength: 8 },
    },
  },
  ProfileUpdateInput: {
    type: "object",
    minProperties: 1,
    properties: {
      fullName: { type: "string", minLength: 2, maxLength: 120 },
      specialization: { type: "string", minLength: 2, maxLength: 120 },
      bio: { type: ["string", "null"], maxLength: 2000 },
    },
  },
  ServiceInput: {
    type: "object",
    required: ["name", "description", "durationMinutes", "price", "methods"],
    properties: {
      name: { type: "string", maxLength: 120 },
      description: { type: "string", maxLength: 5000 },
      durationMinutes: { type: "integer", minimum: 1, maximum: 480 },
      price: { type: "number", minimum: 0 },
      methods: {
        type: "array",
        minItems: 1,
        maxItems: 2,
        items: { type: "string", enum: ["chat", "zoom"] },
      },
    },
  },
  ServiceUpdateInput: {
    type: "object",
    minProperties: 1,
    properties: {
      name: { type: "string", maxLength: 120 },
      description: { type: "string", maxLength: 5000 },
      durationMinutes: { type: "integer", minimum: 1, maximum: 480 },
      price: { type: "number", minimum: 0 },
      methods: {
        type: "array",
        minItems: 1,
        maxItems: 2,
        items: { type: "string", enum: ["chat", "zoom"] },
      },
      isActive: { type: "boolean" },
    },
  },
  CounselorCreateInput: {
    type: "object",
    required: ["fullName", "email", "specialization", "serviceIds"],
    properties: {
      fullName: { type: "string" },
      email: { type: "string", format: "email" },
      specialization: { type: "string", minLength: 2, maxLength: 120 },
      bio: { type: ["string", "null"], maxLength: 2000 },
      serviceIds: {
        type: "array",
        minItems: 1,
        maxItems: 20,
        items: { type: "string", format: "uuid" },
      },
    },
  },
  CounselorUpdateInput: {
    type: "object",
    minProperties: 1,
    properties: {
      fullName: { type: "string" },
      specialization: { type: "string", minLength: 2, maxLength: 120 },
      bio: { type: ["string", "null"], maxLength: 2000 },
      serviceIds: {
        type: "array",
        minItems: 1,
        maxItems: 20,
        items: { type: "string", format: "uuid" },
      },
      isActive: { type: "boolean" },
    },
  },
  TimeSlotCreateInput: {
    type: "object",
    required: ["startTime"],
    properties: {
      startTime: { type: "string", format: "date-time" },
      serviceId: { type: "string", format: "uuid" },
      durationMinutes: { type: "integer", minimum: 15, maximum: 480 },
    },
    description: "Wajib mengisi `serviceId` atau `durationMinutes`.",
  },
  AdminTimeSlotCreateInput: {
    allOf: [
      ref("TimeSlotCreateInput"),
      {
        type: "object",
        required: ["counselorId"],
        properties: { counselorId: { type: "string", format: "uuid" } },
      },
    ],
  },
  TimeSlotUpdateInput: {
    type: "object",
    minProperties: 1,
    properties: {
      startTime: { type: "string", format: "date-time" },
      serviceId: { type: "string", format: "uuid" },
      durationMinutes: { type: "integer", minimum: 15, maximum: 480 },
    },
  },
  BookingCreateInput: {
    type: "object",
    required: ["timeSlotId", "serviceId", "method"],
    properties: {
      timeSlotId: { type: "string", format: "uuid" },
      serviceId: { type: "string", format: "uuid" },
      method: { type: "string", enum: ["chat", "zoom"] },
    },
  },
  MessageCreateInput: {
    type: "object",
    required: ["content", "clientMessageId"],
    properties: {
      content: { type: "string", maxLength: 2000 },
      clientMessageId: {
        type: "string",
        format: "uuid",
        description: "Kunci idempotensi pesan dari klien.",
      },
    },
  },
  UserUpdateInput: {
    type: "object",
    required: ["isActive"],
    properties: { isActive: { type: "boolean" } },
  },
  ClientErrorInput: {
    type: "object",
    required: ["message"],
    properties: {
      message: { type: "string", minLength: 1, maxLength: 2000 },
      stack: { type: "string", maxLength: 10000 },
      digest: { type: "string", maxLength: 200 },
      url: { type: "string", maxLength: 500 },
      context: { type: "object", additionalProperties: true },
    },
  },
};

export function buildOpenApiDocument() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    openapi: "3.1.0",
    info: {
      title: "REHAT API",
      version: "1.0.0",
      description:
        "API backend REHAT — konseling psikologi daring. Semua respons memakai envelope " +
        "`{ success, data, message, errors, code }`. Autentikasi memakai cookie sesi Supabase " +
        "yang diatur oleh `@supabase/ssr`; tidak ada token yang disimpan di localStorage.",
    },
    servers: [{ url: siteUrl, description: "Sesuai NEXT_PUBLIC_SITE_URL" }],
    tags: [
      { name: "Auth", description: "Pendaftaran, login, verifikasi, dan pemulihan akun." },
      { name: "Profil", description: "Profil pengguna dan avatar." },
      { name: "Katalog", description: "Layanan, konselor, dan ketersediaan jadwal (publik)." },
      { name: "Pemesanan", description: "Pembuatan dan riwayat pemesanan." },
      { name: "Pembayaran", description: "Snap Midtrans dan webhook." },
      { name: "Sesi & Chat", description: "Sesi konseling, pesan, dan Zoom." },
      { name: "Konselor", description: "Pengelolaan jadwal oleh konselor." },
      { name: "Admin", description: "Dashboard dan administrasi." },
      { name: "Sistem", description: "Kesehatan layanan dan dokumentasi." },
    ],
    components: {
      securitySchemes: {
        supabaseSession: {
          type: "apiKey",
          in: "cookie",
          name: "sb-<project-ref>-auth-token",
          description:
            "Cookie sesi Supabase (dibuat otomatis oleh @supabase/ssr). Nilainya tidak perlu diisi manual di Swagger UI bila sudah login lewat browser.",
        },
      },
      schemas,
    },
    paths: {
      "/api/v1/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Daftar akun pasien",
          description:
            "Mengirim email verifikasi. Respons selalu generik untuk mencegah enumerasi email.",
          requestBody: { required: true, content: json(ref("SignupInput")) },
          responses: {
            "201": okRes("Pendaftaran diterima.", {
              type: "object",
              properties: { email: { type: "string", format: "email" } },
            }),
            "422": E422,
            "429": E429,
            "502": E502,
          },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login dengan email dan password",
          requestBody: { required: true, content: json(ref("LoginInput")) },
          responses: {
            "200": okRes("Login berhasil.", {
              type: "object",
              properties: {
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    email: { type: "string", format: "email" },
                    role: { type: "string", enum: ["patient", "counselor", "admin"] },
                    fullName: { type: "string" },
                  },
                },
              },
            }),
            "401": E401,
            "403": E403,
            "422": E422,
            "429": E429,
          },
        },
      },
      "/api/v1/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Keluar dari sesi",
          security: auth,
          responses: { "200": okRes("Logout berhasil."), "500": E500 },
        },
      },
      "/api/v1/auth/oauth/google": {
        get: {
          tags: ["Auth"],
          summary: "Mulai login Google",
          description: "Mengembalikan redirect 302 ke halaman OAuth Google melalui Supabase.",
          responses: { "302": { description: "Redirect ke Google." }, "502": E502 },
        },
      },
      "/auth/callback": {
        get: {
          tags: ["Auth"],
          summary: "Callback OAuth",
          parameters: [
            { name: "code", in: "query", required: true, schema: { type: "string" } },
            { name: "next", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "302": { description: "Redirect ke halaman tujuan setelah sesi dibuat." },
            "401": E401,
          },
        },
      },
      "/auth/confirm": {
        get: {
          tags: ["Auth"],
          summary: "Konfirmasi email / magic link",
          parameters: [
            { name: "token_hash", in: "query", schema: { type: "string" } },
            { name: "type", in: "query", schema: { type: "string" } },
            { name: "code", in: "query", schema: { type: "string" } },
            { name: "next", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "302": { description: "Redirect setelah verifikasi." },
            "401": E401,
          },
        },
      },
      "/api/v1/auth/resend-verification": {
        post: {
          tags: ["Auth"],
          summary: "Kirim ulang email verifikasi",
          requestBody: { required: true, content: json(ref("EmailInput")) },
          responses: {
            "200": okRes("Permintaan diterima."),
            "422": E422,
            "429": E429,
          },
        },
      },
      "/api/v1/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Minta tautan reset password",
          requestBody: { required: true, content: json(ref("EmailInput")) },
          responses: {
            "200": okRes("Permintaan diterima."),
            "422": E422,
            "429": E429,
          },
        },
      },
      "/api/v1/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Ganti password dengan sesi recovery",
          security: auth,
          requestBody: { required: true, content: json(ref("ResetPasswordInput")) },
          responses: {
            "200": okRes("Password berhasil diperbarui."),
            "401": E401,
            "422": E422,
          },
        },
      },
      "/api/v1/auth/email-hook": {
        post: {
          tags: ["Auth"],
          summary: "Supabase Send Email Hook",
          description:
            "Dipanggil Supabase, bukan klien. Memverifikasi signature Standard Webhooks lalu mengirim email via Resend.",
          parameters: [
            { name: "webhook-id", in: "header", required: true, schema: { type: "string" } },
            {
              name: "webhook-timestamp",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "webhook-signature",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Email diterima untuk dikirim." },
            "401": E401,
            "500": E500,
          },
        },
      },
      "/api/v1/profile": {
        get: {
          tags: ["Profil"],
          summary: "Profil pengguna saat ini",
          security: auth,
          responses: {
            "200": okRes("Profil pengguna.", ref("Profile")),
            "401": E401,
            "403": E403,
          },
        },
        patch: {
          tags: ["Profil"],
          summary: "Perbarui profil",
          security: auth,
          requestBody: { required: true, content: json(ref("ProfileUpdateInput")) },
          responses: {
            "200": okRes("Profil diperbarui.", ref("Profile")),
            "401": E401,
            "403": E403,
            "422": E422,
          },
        },
      },
      "/api/v1/profile/avatar": {
        post: {
          tags: ["Profil"],
          summary: "Unggah avatar",
          security: auth,
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "JPG/PNG/WebP, maksimal 5 MB.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": okRes("Avatar diperbarui.", ref("Profile")),
            "401": E401,
            "422": E422,
            "502": E502,
          },
        },
        delete: {
          tags: ["Profil"],
          summary: "Hapus avatar",
          security: auth,
          responses: {
            "200": okRes("Avatar dihapus.", ref("Profile")),
            "401": E401,
            "502": E502,
          },
        },
      },
      "/api/v1/services": {
        get: {
          tags: ["Katalog"],
          summary: "Daftar layanan aktif",
          parameters: [
            { name: "method", in: "query", schema: { type: "string", enum: ["chat", "zoom"] } },
            { name: "q", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": okRes("Daftar layanan.", { type: "array", items: ref("Service") }),
          },
        },
      },
      "/api/v1/services/{id}": {
        get: {
          tags: ["Katalog"],
          summary: "Detail layanan aktif",
          parameters: [idParam],
          responses: {
            "200": okRes("Detail layanan.", ref("Service")),
            "404": E404,
          },
        },
      },
      "/api/v1/counselors": {
        get: {
          tags: ["Katalog"],
          summary: "Daftar konselor aktif",
          parameters: [
            {
              name: "serviceId",
              in: "query",
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": okRes("Daftar konselor.", { type: "array", items: ref("Counselor") }),
          },
        },
      },
      "/api/v1/counselors/{id}": {
        get: {
          tags: ["Katalog"],
          summary: "Detail konselor",
          parameters: [idParam],
          responses: {
            "200": okRes("Detail konselor.", ref("Counselor")),
            "404": E404,
          },
        },
      },
      "/api/v1/time-slots": {
        get: {
          tags: ["Katalog"],
          summary: "Slot tersedia",
          description: "Hanya mengembalikan slot `available` yang belum lewat.",
          parameters: [
            {
              name: "counselorId",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "serviceId",
              in: "query",
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "date",
              in: "query",
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            },
          ],
          responses: {
            "200": okRes("Slot tersedia.", { type: "array", items: ref("TimeSlot") }),
            "422": E422,
          },
        },
      },
      "/api/v1/bookings": {
        post: {
          tags: ["Pemesanan"],
          summary: "Buat pemesanan",
          security: auth,
          parameters: [
            {
              name: "Idempotency-Key",
              in: "header",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: { required: true, content: json(ref("BookingCreateInput")) },
          responses: {
            "201": okRes("Pemesanan dibuat.", ref("Booking")),
            "401": E401,
            "403": E403,
            "409": E409,
            "422": E422,
          },
        },
        get: {
          tags: ["Pemesanan"],
          summary: "Riwayat pemesanan sesuai peran",
          security: auth,
          parameters: [
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["pending_payment", "confirmed", "cancelled", "expired"],
              },
            },
            { name: "method", in: "query", schema: { type: "string", enum: ["chat", "zoom"] } },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar pemesanan.", paginated(ref("Booking"))),
            "401": E401,
          },
        },
      },
      "/api/v1/bookings/{id}": {
        get: {
          tags: ["Pemesanan"],
          summary: "Detail pemesanan",
          security: auth,
          parameters: [idParam],
          responses: {
            "200": okRes("Detail pemesanan.", ref("Booking")),
            "401": E401,
            "404": E404,
          },
        },
      },
      "/api/v1/bookings/{id}/payments": {
        post: {
          tags: ["Pembayaran"],
          summary: "Buat atau lanjutkan pembayaran Snap",
          security: auth,
          parameters: [idParam],
          responses: {
            "201": okRes("Transaksi Snap dibuat atau dilanjutkan.", {
              type: "object",
              properties: {
                paymentId: { type: "string", format: "uuid" },
                midtransOrderId: { type: "string" },
                snapToken: { type: "string" },
                redirectUrl: { type: ["string", "null"], format: "uri" },
                grossAmount: { type: "number" },
                expiresAt: { type: ["string", "null"], format: "date-time" },
              },
            }),
            "401": E401,
            "403": E403,
            "404": E404,
            "409": E409,
            "502": E502,
          },
        },
        get: {
          tags: ["Pembayaran"],
          summary: "Riwayat pembayaran satu pemesanan",
          security: auth,
          parameters: [idParam],
          responses: {
            "200": okRes("Daftar pembayaran.", { type: "array", items: ref("Payment") }),
            "401": E401,
            "404": E404,
          },
        },
      },
      "/api/v1/payments": {
        get: {
          tags: ["Pembayaran"],
          summary: "Riwayat pembayaran pasien",
          security: auth,
          parameters: [...pageParams],
          responses: {
            "200": okRes("Daftar pembayaran.", paginated(ref("Payment"))),
            "401": E401,
            "403": E403,
          },
        },
      },
      "/api/v1/webhooks/midtrans": {
        post: {
          tags: ["Pembayaran"],
          summary: "Webhook notifikasi Midtrans",
          description:
            "Memverifikasi signature SHA512, mencatat event secara idempoten, lalu memperbarui status pembayaran, pemesanan, dan slot.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "order_id",
                    "status_code",
                    "gross_amount",
                    "signature_key",
                    "transaction_status",
                  ],
                  properties: {
                    order_id: { type: "string" },
                    status_code: { type: "string" },
                    gross_amount: { type: "string" },
                    signature_key: { type: "string" },
                    transaction_status: { type: "string" },
                    fraud_status: { type: "string" },
                    transaction_id: { type: "string" },
                    payment_type: { type: "string" },
                    transaction_time: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Notifikasi diterima (termasuk bila signature tidak valid)." },
            "500": E500,
          },
        },
      },
      "/api/v1/sessions": {
        get: {
          tags: ["Sesi & Chat"],
          summary: "Daftar sesi milik pengguna",
          security: auth,
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["scheduled", "active", "completed"] },
            },
            { name: "method", in: "query", schema: { type: "string", enum: ["chat", "zoom"] } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar sesi.", paginated(ref("Session"))),
            "401": E401,
            "403": E403,
          },
        },
      },
      "/api/v1/sessions/{id}": {
        get: {
          tags: ["Sesi & Chat"],
          summary: "Detail sesi",
          security: auth,
          parameters: [idParam],
          responses: {
            "200": okRes("Detail sesi.", ref("Session")),
            "401": E401,
            "404": E404,
          },
        },
      },
      "/api/v1/sessions/{id}/messages": {
        get: {
          tags: ["Sesi & Chat"],
          summary: "Riwayat pesan (cursor)",
          security: auth,
          parameters: [
            idParam,
            {
              name: "before",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 50 },
            },
          ],
          responses: {
            "200": okRes("Daftar pesan.", {
              type: "object",
              properties: {
                items: { type: "array", items: ref("ChatMessage") },
                hasMore: { type: "boolean" },
                nextBefore: { type: ["string", "null"], format: "date-time" },
              },
            }),
            "401": E401,
            "403": E403,
            "404": E404,
          },
        },
        post: {
          tags: ["Sesi & Chat"],
          summary: "Kirim pesan",
          description:
            "Idempoten melalui `clientMessageId`. Admin selalu ditolak 403. Hanya dapat menulis selama jendela sesi.",
          security: auth,
          parameters: [idParam],
          requestBody: { required: true, content: json(ref("MessageCreateInput")) },
          responses: {
            "201": okRes("Pesan terkirim.", ref("ChatMessage")),
            "200": okRes("Pesan duplikat; mengembalikan pesan lama.", ref("ChatMessage")),
            "401": E401,
            "403": E403,
            "409": E409,
            "422": E422,
          },
        },
      },
      "/api/v1/sessions/{id}/zoom": {
        post: {
          tags: ["Sesi & Chat"],
          summary: "Buat ulang meeting Zoom",
          description: "Hanya konselor pemilik sesi.",
          security: auth,
          parameters: [idParam],
          responses: {
            "200": okRes("Meeting Zoom siap.", ref("Session")),
            "401": E401,
            "403": E403,
            "404": E404,
            "502": E502,
          },
        },
      },
      "/api/v1/counselor/time-slots": {
        get: {
          tags: ["Konselor"],
          summary: "Jadwal milik konselor",
          security: auth,
          parameters: [
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["available", "held", "booked"] },
            },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar slot.", paginated(ref("TimeSlot"))),
            "401": E401,
            "403": E403,
          },
        },
        post: {
          tags: ["Konselor"],
          summary: "Tambah slot jadwal",
          security: auth,
          requestBody: { required: true, content: json(ref("TimeSlotCreateInput")) },
          responses: {
            "201": okRes("Slot dibuat.", ref("TimeSlot")),
            "401": E401,
            "403": E403,
            "409": E409,
            "422": E422,
          },
        },
      },
      "/api/v1/counselor/time-slots/{id}": {
        patch: {
          tags: ["Konselor"],
          summary: "Ubah slot jadwal",
          security: auth,
          parameters: [idParam],
          requestBody: { required: true, content: json(ref("TimeSlotUpdateInput")) },
          responses: {
            "200": okRes("Slot diperbarui.", ref("TimeSlot")),
            "401": E401,
            "403": E403,
            "404": E404,
            "409": E409,
            "422": E422,
          },
        },
        delete: {
          tags: ["Konselor"],
          summary: "Hapus slot jadwal",
          security: auth,
          parameters: [idParam],
          responses: {
            "200": okRes("Slot dihapus."),
            "401": E401,
            "403": E403,
            "404": E404,
            "409": E409,
          },
        },
      },
      "/api/v1/admin/stats": {
        get: {
          tags: ["Admin"],
          summary: "Ringkasan dashboard",
          security: auth,
          responses: {
            "200": okRes("Statistik operasional.", ref("AdminStats")),
            "401": E401,
            "403": E403,
          },
        },
      },
      "/api/v1/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "Daftar pengguna",
          security: auth,
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "role", in: "query", schema: { type: "string", enum: ["patient", "counselor"] } },
            { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar pengguna.", paginated(ref("AdminUser"))),
            "401": E401,
            "403": E403,
          },
        },
      },
      "/api/v1/admin/users/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Detail pengguna",
          security: auth,
          parameters: [idParam],
          responses: {
            "200": okRes("Detail pengguna.", {
              allOf: [
                ref("AdminUser"),
                {
                  type: "object",
                  properties: {
                    counselorProfile: {
                      type: ["object", "null"],
                      properties: {
                        specialization: { type: "string" },
                        bio: { type: ["string", "null"] },
                      },
                    },
                    stats: {
                      type: "object",
                      properties: {
                        bookingsAsPatient: { type: "integer" },
                        bookingsAsCounselor: { type: "integer" },
                      },
                    },
                  },
                },
              ],
            }),
            "401": E401,
            "403": E403,
            "404": E404,
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "Aktifkan / nonaktifkan akun",
          security: auth,
          parameters: [idParam],
          requestBody: { required: true, content: json(ref("UserUpdateInput")) },
          responses: {
            "200": okRes("Status akun diperbarui.", ref("AdminUser")),
            "401": E401,
            "403": E403,
            "404": E404,
            "422": E422,
          },
        },
      },
      "/api/v1/admin/counselors": {
        get: {
          tags: ["Admin"],
          summary: "Daftar konselor",
          security: auth,
          parameters: [
            { name: "serviceId", in: "query", schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": okRes("Daftar konselor.", { type: "array", items: ref("AdminCounselor") }),
            "401": E401,
            "403": E403,
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Buat akun konselor",
          description:
            "Membuat akun Supabase (undangan email) dengan `app_metadata.role = counselor`, lalu menyimpan profil dan layanan.",
          security: auth,
          requestBody: { required: true, content: json(ref("CounselorCreateInput")) },
          responses: {
            "201": okRes("Konselor dibuat.", ref("AdminCounselor")),
            "401": E401,
            "403": E403,
            "422": E422,
            "502": E502,
          },
        },
      },
      "/api/v1/admin/counselors/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Ubah data konselor",
          security: auth,
          parameters: [idParam],
          requestBody: { required: true, content: json(ref("CounselorUpdateInput")) },
          responses: {
            "200": okRes("Data konselor diperbarui.", ref("AdminCounselor")),
            "401": E401,
            "403": E403,
            "404": E404,
            "422": E422,
          },
        },
      },
      "/api/v1/admin/services": {
        get: {
          tags: ["Admin"],
          summary: "Daftar semua layanan",
          security: auth,
          parameters: [
            { name: "method", in: "query", schema: { type: "string", enum: ["chat", "zoom"] } },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          ],
          responses: {
            "200": okRes("Daftar layanan.", { type: "array", items: ref("Service") }),
            "401": E401,
            "403": E403,
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Buat layanan",
          security: auth,
          requestBody: { required: true, content: json(ref("ServiceInput")) },
          responses: {
            "201": okRes("Layanan dibuat.", ref("Service")),
            "401": E401,
            "403": E403,
            "422": E422,
          },
        },
      },
      "/api/v1/admin/services/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Ubah layanan",
          security: auth,
          parameters: [idParam],
          requestBody: { required: true, content: json(ref("ServiceUpdateInput")) },
          responses: {
            "200": okRes("Layanan diperbarui.", ref("Service")),
            "401": E401,
            "403": E403,
            "404": E404,
            "422": E422,
          },
        },
      },
      "/api/v1/admin/time-slots": {
        get: {
          tags: ["Admin"],
          summary: "Daftar slot jadwal",
          security: auth,
          parameters: [
            { name: "counselorId", in: "query", schema: { type: "string", format: "uuid" } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["available", "held", "booked"] },
            },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar slot.", paginated(ref("TimeSlot"))),
            "401": E401,
            "403": E403,
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Buat slot untuk konselor",
          security: auth,
          requestBody: { required: true, content: json(ref("AdminTimeSlotCreateInput")) },
          responses: {
            "201": okRes("Slot dibuat.", ref("TimeSlot")),
            "401": E401,
            "403": E403,
            "409": E409,
            "422": E422,
          },
        },
      },
      "/api/v1/admin/time-slots/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Ubah slot",
          security: auth,
          parameters: [idParam],
          requestBody: { required: true, content: json(ref("TimeSlotUpdateInput")) },
          responses: {
            "200": okRes("Slot diperbarui.", ref("TimeSlot")),
            "401": E401,
            "403": E403,
            "404": E404,
            "409": E409,
            "422": E422,
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Hapus slot",
          security: auth,
          parameters: [idParam],
          responses: {
            "200": okRes("Slot dihapus."),
            "401": E401,
            "403": E403,
            "404": E404,
            "409": E409,
          },
        },
      },
      "/api/v1/admin/bookings": {
        get: {
          tags: ["Admin"],
          summary: "Semua pemesanan",
          security: auth,
          parameters: [
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["pending_payment", "confirmed", "cancelled", "expired"],
              },
            },
            { name: "method", in: "query", schema: { type: "string", enum: ["chat", "zoom"] } },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar pemesanan.", paginated(ref("Booking"))),
            "401": E401,
            "403": E403,
          },
        },
      },
      "/api/v1/admin/payments": {
        get: {
          tags: ["Admin"],
          summary: "Semua transaksi",
          security: auth,
          parameters: [
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["pending", "success", "failed", "cancelled", "expired"],
              },
            },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar transaksi.", paginated(ref("Payment"))),
            "401": E401,
            "403": E403,
          },
        },
      },
      "/api/v1/admin/sessions": {
        get: {
          tags: ["Admin"],
          summary: "Semua sesi (tanpa isi chat)",
          security: auth,
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["scheduled", "active", "completed"] },
            },
            { name: "method", in: "query", schema: { type: "string", enum: ["chat", "zoom"] } },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
            ...pageParams,
          ],
          responses: {
            "200": okRes("Daftar sesi.", paginated(ref("Session"))),
            "401": E401,
            "403": E403,
          },
        },
      },
      "/api/v1/admin/zoom/{sessionId}/retry": {
        post: {
          tags: ["Admin"],
          summary: "Coba ulang pembuatan meeting Zoom",
          security: auth,
          parameters: [
            {
              name: "sessionId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": okRes("Meeting Zoom siap.", ref("Session")),
            "401": E401,
            "403": E403,
            "404": E404,
            "502": E502,
          },
        },
      },
      "/api/v1/health": {
        get: {
          tags: ["Sistem"],
          summary: "Kesehatan layanan",
          responses: {
            "200": okRes("Layanan sehat.", ref("Health")),
            "503": {
              description: "Database tidak dapat dijangkau.",
              content: json(envelope(ref("Health"))),
            },
          },
        },
      },
      "/api/v1/health/live": {
        get: {
          tags: ["Sistem"],
          summary: "Liveness probe",
          description:
            "Memeriksa apakah proses hidup tanpa menyentuh database. Cocok untuk uptime monitor.",
          responses: {
            "200": okRes("Proses hidup.", ref("Health")),
          },
        },
      },
      "/api/v1/health/ready": {
        get: {
          tags: ["Sistem"],
          summary: "Readiness probe",
          description:
            "Memeriksa kesiapan dependensi utama (database). Mengembalikan 503 bila DB tidak dapat dijangkau.",
          responses: {
            "200": okRes("Dependensi siap.", ref("Health")),
            "503": {
              description: "Database tidak dapat dijangkau.",
              content: json(envelope(ref("Health"))),
            },
          },
        },
      },
      "/api/v1/client-errors": {
        post: {
          tags: ["Sistem"],
          summary: "Laporkan error dari browser",
          description:
            "Sink error klien (dipakai error boundary). Dibatasi 20 permintaan per menit per IP.",
          requestBody: {
            required: true,
            content: json(ref("ClientErrorInput")),
          },
          responses: {
            "202": okRes("Laporan diterima."),
            "422": E422,
            "429": E429,
          },
        },
      },
      "/api/cron/expire-bookings": {
        get: {
          tags: ["Sistem"],
          summary: "Cron: kedaluwarsakan pemesanan",
          description:
            "Melepas slot dari pemesanan yang melewati batas pembayaran. " +
            "Dipanggil oleh Vercel Cron dengan header `Authorization: Bearer <CRON_SECRET>`.",
          parameters: [
            {
              name: "Authorization",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": okRes("Cron selesai.", {
              type: "object",
              properties: { expired: { type: "integer" } },
            }),
            "401": E401,
            "500": E500,
          },
        },
      },
      "/api/docs": {
        get: {
          tags: ["Sistem"],
          summary: "Dokumen OpenAPI 3.1",
          responses: {
            "200": {
              description: "Dokumen OpenAPI.",
              content: json({ type: "object" }),
            },
          },
        },
      },
    },
  };
}
