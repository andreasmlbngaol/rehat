import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/auth";
import {
  bookingListQuerySchema,
  createBookingSchema,
  idempotencyKeySchema,
} from "@/lib/validation/booking";
import {
  createCounselorSchema,
  updateCounselorSchema,
} from "@/lib/validation/counselor";
import {
  createServiceSchema,
  updateServiceSchema,
} from "@/lib/validation/service";
import {
  adminCreateTimeSlotSchema,
  counselorCreateTimeSlotSchema,
  publicTimeSlotQuerySchema,
  timeSlotListQuerySchema,
  updateTimeSlotSchema,
} from "@/lib/validation/time-slot";
import { updateProfileSchema } from "@/lib/validation/profile";
import {
  adminUpdateUserSchema,
  adminUserQuerySchema,
} from "@/lib/validation/admin";
import {
  messageListQuerySchema,
  sendMessageSchema,
  sessionListQuerySchema,
} from "@/lib/validation/chat";
import {
  emailSchema,
  fullNameSchema,
  paginationSchema,
  passwordSchema,
  uuidSchema,
} from "@/lib/validation/common";

const uuid = "11111111-1111-4111-8111-111111111111";
const otherUuid = "22222222-2222-4222-8222-222222222222";

function messages(result: {
  success: boolean;
  error?: { issues: Array<{ message: string; path: PropertyKey[] }> };
}): string[] {
  return result.success ? [] : (result.error?.issues ?? []).map((i) => i.message);
}

describe("common schemas", () => {
  it("uuidSchema menerima UUID valid", () => {
    expect(uuidSchema.safeParse(uuid).success).toBe(true);
  });

  it("uuidSchema menolak string biasa", () => {
    expect(uuidSchema.safeParse("bukan-uuid").success).toBe(false);
  });

  it("emailSchema menormalisasi huruf dan spasi", () => {
    expect(emailSchema.parse("  Ayu@Example.COM ")).toBe("ayu@example.com");
  });

  it("emailSchema menolak format salah", () => {
    expect(emailSchema.safeParse("bukan-email").success).toBe(false);
  });

  it("passwordSchema menegakkan panjang 8–72", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(passwordSchema.safeParse("x".repeat(73)).success).toBe(false);
  });

  it("fullNameSchema memangkas dan membatasi panjang", () => {
    expect(fullNameSchema.parse("  Ayu  ")).toBe("Ayu");
    expect(fullNameSchema.safeParse("A").success).toBe(false);
  });

  it("paginationSchema memakai default dan coercion", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(paginationSchema.parse({ page: "3", limit: "50" })).toEqual({
      page: 3,
      limit: 50,
    });
    expect(paginationSchema.safeParse({ limit: "51" }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  const valid = {
    fullName: "Ayu Prameswari",
    email: "Ayu@Example.com",
    password: "rahasia123",
    confirmPassword: "rahasia123",
  };

  it("signup valid menormalisasi email", () => {
    const parsed = signupSchema.parse(valid);
    expect(parsed.email).toBe("ayu@example.com");
  });

  it("signup menolak konfirmasi password berbeda", () => {
    const result = signupSchema.safeParse({
      ...valid,
      confirmPassword: "berbeda",
    });
    expect(result.success).toBe(false);
    expect(messages(result)).toContain("Konfirmasi password tidak sama.");
  });

  it("login mewajibkan password", () => {
    expect(loginSchema.safeParse({ email: valid.email, password: "" }).success).toBe(
      false,
    );
  });

  it("forgot dan resend verification memakai email yang sama", () => {
    expect(forgotPasswordSchema.parse({ email: " A@B.COM " }).email).toBe(
      "a@b.com",
    );
    expect(
      resendVerificationSchema.parse({ email: " A@B.COM " }).email,
    ).toBe("a@b.com");
  });

  it("reset password menolak konfirmasi berbeda", () => {
    const result = resetPasswordSchema.safeParse({
      password: "rahasia123",
      confirmPassword: "rahasia456",
    });
    expect(result.success).toBe(false);
  });
});

describe("booking schemas", () => {
  it("createBooking valid", () => {
    const parsed = createBookingSchema.parse({
      timeSlotId: uuid,
      serviceId: otherUuid,
      method: "zoom",
    });
    expect(parsed.method).toBe("zoom");
  });

  it("createBooking menolak UUID dan metode tidak valid", () => {
    const result = createBookingSchema.safeParse({
      timeSlotId: "x",
      serviceId: otherUuid,
      method: "telepon",
    });
    expect(result.success).toBe(false);
  });

  it("bookingListQuery memakai default pagination", () => {
    expect(bookingListQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
    });
  });

  it("bookingListQuery mengubah string tanggal menjadi Date", () => {
    const parsed = bookingListQuerySchema.parse({ from: "2026-01-01" });
    expect(parsed.from).toBeInstanceOf(Date);
  });

  it("idempotencyKeySchema mewajibkan UUID", () => {
    expect(idempotencyKeySchema.safeParse(uuid).success).toBe(true);
    expect(idempotencyKeySchema.safeParse("abc").success).toBe(false);
  });
});

describe("service schemas", () => {
  const valid = {
    name: "Konseling Individu",
    description: "Deskripsi layanan.",
    durationMinutes: 60,
    price: 150_000,
    methods: ["chat", "zoom"],
  };

  it("createService valid", () => {
    expect(createServiceSchema.parse(valid)).toMatchObject(valid);
  });

  it("createService melakukan coercion angka", () => {
    const parsed = createServiceSchema.parse({
      ...valid,
      durationMinutes: "90",
      price: "250000",
    });
    expect(parsed.durationMinutes).toBe(90);
    expect(parsed.price).toBe(250_000);
  });

  it("createService menolak harga negatif dan durasi nol", () => {
    expect(
      createServiceSchema.safeParse({ ...valid, price: -1 }).success,
    ).toBe(false);
    expect(
      createServiceSchema.safeParse({ ...valid, durationMinutes: 0 }).success,
    ).toBe(false);
  });

  it("createService menolak metode kosong atau duplikat", () => {
    expect(
      createServiceSchema.safeParse({ ...valid, methods: [] }).success,
    ).toBe(false);
    expect(
      createServiceSchema.safeParse({ ...valid, methods: ["chat", "chat"] })
        .success,
    ).toBe(false);
  });

  it("updateService menolak objek kosong", () => {
    expect(updateServiceSchema.safeParse({}).success).toBe(false);
    expect(updateServiceSchema.safeParse({ isActive: false }).success).toBe(
      true,
    );
  });
});

describe("counselor schemas", () => {
  const valid = {
    fullName: "Ayu Prameswari",
    email: "ayu@example.com",
    specialization: "Kecemasan",
    serviceIds: [uuid],
  };

  it("createCounselor valid", () => {
    expect(createCounselorSchema.safeParse(valid).success).toBe(true);
  });

  it("createCounselor mewajibkan minimal satu layanan", () => {
    expect(
      createCounselorSchema.safeParse({ ...valid, serviceIds: [] }).success,
    ).toBe(false);
  });

  it("createCounselor menerima bio null", () => {
    expect(
      createCounselorSchema.safeParse({ ...valid, bio: null }).success,
    ).toBe(true);
  });

  it("updateCounselor menolak objek kosong", () => {
    expect(updateCounselorSchema.safeParse({}).success).toBe(false);
  });
});

describe("time slot schemas", () => {
  it("counselorCreateTimeSlot membutuhkan serviceId atau duration", () => {
    expect(
      counselorCreateTimeSlotSchema.safeParse({
        startTime: "2026-12-01T09:00:00+07:00",
      }).success,
    ).toBe(false);

    expect(
      counselorCreateTimeSlotSchema.safeParse({
        startTime: "2026-12-01T09:00:00+07:00",
        durationMinutes: 60,
      }).success,
    ).toBe(true);
  });

  it("counselorCreateTimeSlot menolak durasi di bawah 15 menit", () => {
    expect(
      counselorCreateTimeSlotSchema.safeParse({
        startTime: "2026-12-01T09:00:00+07:00",
        durationMinutes: 10,
      }).success,
    ).toBe(false);
  });

  it("adminCreateTimeSlot mewajibkan counselorId", () => {
    expect(
      adminCreateTimeSlotSchema.safeParse({
        startTime: "2026-12-01T09:00:00+07:00",
        durationMinutes: 60,
      }).success,
    ).toBe(false);
    expect(
      adminCreateTimeSlotSchema.safeParse({
        startTime: "2026-12-01T09:00:00+07:00",
        durationMinutes: 60,
        counselorId: uuid,
      }).success,
    ).toBe(true);
  });

  it("updateTimeSlot menolak objek kosong", () => {
    expect(updateTimeSlotSchema.safeParse({}).success).toBe(false);
  });

  it("timeSlotListQuery memakai default", () => {
    expect(timeSlotListQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
    });
  });

  it("publicTimeSlotQuery mewajibkan counselorId dan format tanggal", () => {
    expect(
      publicTimeSlotQuerySchema.safeParse({ counselorId: uuid }).success,
    ).toBe(true);
    expect(
      publicTimeSlotQuerySchema.safeParse({
        counselorId: uuid,
        date: "01-12-2026",
      }).success,
    ).toBe(false);
  });
});

describe("profile dan admin schemas", () => {
  it("updateProfile menerima bio null", () => {
    expect(updateProfileSchema.safeParse({ bio: null }).success).toBe(true);
  });

  it("updateProfile menolak objek kosong", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("adminUserQuery mengubah isActive menjadi boolean", () => {
    expect(adminUserQuerySchema.parse({ isActive: "false" }).isActive).toBe(
      false,
    );
    expect(adminUserQuerySchema.parse({ isActive: "true" }).isActive).toBe(
      true,
    );
  });

  it("adminUserQuery menolak peran admin", () => {
    expect(adminUserQuerySchema.safeParse({ role: "admin" }).success).toBe(
      false,
    );
  });

  it("adminUpdateUser mewajibkan isActive boolean", () => {
    expect(adminUpdateUserSchema.safeParse({ isActive: true }).success).toBe(
      true,
    );
    expect(adminUpdateUserSchema.safeParse({ isActive: "true" }).success).toBe(
      false,
    );
  });
});

describe("chat schemas", () => {
  it("sendMessage mewajibkan clientMessageId UUID", () => {
    expect(
      sendMessageSchema.safeParse({ content: "Halo", clientMessageId: uuid })
        .success,
    ).toBe(true);
    expect(
      sendMessageSchema.safeParse({ content: "Halo", clientMessageId: "x" })
        .success,
    ).toBe(false);
  });

  it("sendMessage membatasi panjang konten", () => {
    expect(
      sendMessageSchema.safeParse({
        content: "x".repeat(4001),
        clientMessageId: uuid,
      }).success,
    ).toBe(false);
  });

  it("messageListQuery memakai default limit 50", () => {
    expect(messageListQuerySchema.parse({}).limit).toBe(50);
  });

  it("sessionListQuery memakai default pagination", () => {
    expect(sessionListQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
    });
  });
});
