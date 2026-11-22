import { describe, expect, it } from "vitest";
import { toBookingDto } from "@/lib/dto/booking";
import {
  toAdminCounselorDto,
  toPublicCounselorDto,
  toServiceDto,
} from "@/lib/dto/catalog";
import { paginated } from "@/lib/dto/pagination";
import { toPaymentDto } from "@/lib/dto/payment";
import { toProfileDto } from "@/lib/dto/profile";
import {
  toMessageDto,
  toSessionDto,
  zoomJoinWindow,
} from "@/lib/dto/session";
import { toAdminUserDto } from "@/lib/dto/user";

const now = new Date("2026-01-10T03:00:00.000Z");
const start = new Date("2026-01-15T09:00:00.000Z");
const end = new Date("2026-01-15T10:00:00.000Z");

function baseBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    bookingCode: "RHT-260115-ABCD1234",
    patientId: "patient-1",
    counselorId: "counselor-1",
    serviceId: "service-1",
    timeSlotId: "slot-1",
    method: "chat",
    status: "confirmed",
    paymentExpiresAt: new Date("2026-01-10T04:00:00.000Z"),
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
    serviceName: "Konseling Individu",
    durationMinutes: 60,
    price: 150000,
    scheduledStart: start,
    scheduledEnd: end,
    createdAt: now,
    updatedAt: now,
    patient: {
      id: "patient-1",
      fullName: "Pasien Uji",
      avatarKey: "avatars/patient.png",
    },
    counselor: {
      id: "counselor-1",
      fullName: "Konselor Uji",
      avatarKey: null,
    },
    payments: [],
    session: null,
    ...overrides,
  };
}

describe("toBookingDto", () => {
  it("memetakan field dan mengubah harga menjadi number", () => {
    const dto = toBookingDto(baseBooking() as never, "patient");

    expect(dto).toMatchObject({
      id: "booking-1",
      bookingCode: "RHT-260115-ABCD1234",
      price: 150000,
      status: "confirmed",
      method: "chat",
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
    });
    expect(dto.patient.avatarUrl).toBe(
      "https://cdn.test.local/avatars/patient.png",
    );
    expect(dto.counselor.avatarUrl).toBeNull();
  });

  it("menyembunyikan detail pembayaran dari konselor", () => {
    const booking = baseBooking({
      payments: [
        {
          id: "payment-1",
          status: "success",
          grossAmount: 150000,
          paymentType: "bank_transfer",
          transactionTime: now,
          expiresAt: null,
        },
      ],
    });

    const dto = toBookingDto(booking as never, "counselor");
    expect(dto.payment).toEqual({ status: "success" });
  });

  it("menampilkan detail pembayaran untuk pasien", () => {
    const booking = baseBooking({
      payments: [
        {
          id: "payment-1",
          status: "success",
          grossAmount: 150000,
          paymentType: "bank_transfer",
          transactionTime: now,
          expiresAt: null,
        },
      ],
    });

    const dto = toBookingDto(booking as never, "patient");
    expect(dto.payment).toEqual({
      id: "payment-1",
      status: "success",
      grossAmount: 150000,
      paymentType: "bank_transfer",
      transactionTime: now.toISOString(),
      expiresAt: null,
    });
  });

  it("payment dan session null bila belum ada", () => {
    const dto = toBookingDto(baseBooking() as never, "patient");
    expect(dto.payment).toBeNull();
    expect(dto.session).toBeNull();
  });

  it("memetakan sesi bila ada", () => {
    const dto = toBookingDto(
      baseBooking({
        session: {
          id: "session-1",
          status: "active",
          startedAt: start,
          endedAt: null,
        },
      }) as never,
      "patient",
    );

    expect(dto.session).toEqual({
      id: "session-1",
      status: "active",
      startedAt: start.toISOString(),
      endedAt: null,
    });
  });
});

describe("toServiceDto", () => {
  it("memetakan layanan dan metode", () => {
    const dto = toServiceDto({
      id: "service-1",
      name: "Konseling Individu",
      description: "Deskripsi",
      durationMinutes: 60,
      price: 150000,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      methods: [
        { serviceId: "service-1", method: "chat" },
        { serviceId: "service-1", method: "zoom" },
      ],
    } as never);

    expect(dto).toEqual({
      id: "service-1",
      name: "Konseling Individu",
      description: "Deskripsi",
      durationMinutes: 60,
      price: 150000,
      isActive: true,
      methods: ["chat", "zoom"],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });
});

describe("counselor DTO", () => {
  function counselor(overrides: Record<string, unknown> = {}) {
    return {
      id: "counselor-1",
      fullName: "Ayu Prameswari",
      email: "ayu@example.com",
      role: "counselor",
      avatarKey: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      counselorProfile: {
        counselorId: "counselor-1",
        specialization: "Kecemasan",
        bio: "Bio",
        createdAt: now,
        updatedAt: now,
      },
      counselorServices: [
        {
          counselorId: "counselor-1",
          serviceId: "service-1",
          service: { id: "service-1", name: "Konseling Individu" },
        },
      ],
      ...overrides,
    };
  }

  it("toPublicCounselorDto tidak membocorkan email", () => {
    const dto = toPublicCounselorDto(counselor() as never);

    expect(dto).toMatchObject({
      id: "counselor-1",
      specialization: "Kecemasan",
      bio: "Bio",
      services: [{ id: "service-1", name: "Konseling Individu" }],
    });
    expect("email" in dto).toBe(false);
  });

  it("toPublicCounselorDto menangani profil kosong", () => {
    const dto = toPublicCounselorDto(
      counselor({
        counselorProfile: null,
        counselorServices: [],
      }) as never,
    );

    expect(dto.specialization).toBeNull();
    expect(dto.bio).toBeNull();
    expect(dto.services).toEqual([]);
  });

  it("toAdminCounselorDto menyertakan email dan status", () => {
    const dto = toAdminCounselorDto(counselor() as never);
    expect(dto.email).toBe("ayu@example.com");
    expect(dto.isActive).toBe(true);
  });
});

describe("toPaymentDto", () => {
  function payment(overrides: Record<string, unknown> = {}) {
    return {
      id: "payment-1",
      bookingId: "booking-1",
      midtransOrderId: "RHT-1",
      snapToken: "snap-token",
      midtransTransactionId: "trx-1",
      grossAmount: 150000,
      paymentType: "bank_transfer",
      status: "success",
      transactionTime: now,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  it("menyembunyikan snap token secara default", () => {
    const dto = toPaymentDto(payment() as never);
    expect(dto).not.toHaveProperty("snapToken");
    expect(dto.grossAmount).toBe(150000);
  });

  it("menyertakan snap token bila diminta", () => {
    const dto = toPaymentDto(payment() as never, { includeSnapToken: true });
    expect(dto.snapToken).toBe("snap-token");
  });

  it("memetakan ringkasan booking bila ada", () => {
    const dto = toPaymentDto(
      payment({
        booking: {
          id: "booking-1",
          bookingCode: "RHT-1",
          serviceName: "Konseling Individu",
          scheduledStart: start,
        },
      }) as never,
    );

    expect(dto.booking).toEqual({
      id: "booking-1",
      bookingCode: "RHT-1",
      serviceName: "Konseling Individu",
      scheduledStart: start.toISOString(),
    });
  });
});

describe("session DTO", () => {
  const sessionStart = new Date(Date.now() + 60 * 60_000);
  const sessionEnd = new Date(Date.now() + 120 * 60_000);

  function session(overrides: Record<string, unknown> = {}) {
    return {
      id: "session-1",
      bookingId: "booking-1",
      status: "scheduled",
      startedAt: null,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
      booking: {
        id: "booking-1",
        bookingCode: "RHT-1",
        serviceName: "Konseling Individu",
        method: "chat",
        durationMinutes: 60,
        scheduledStart: sessionStart,
        scheduledEnd: sessionEnd,
        status: "confirmed",
        patient: {
          id: "patient-1",
          fullName: "Pasien Uji",
          avatarKey: null,
        },
        counselor: {
          id: "counselor-1",
          fullName: "Konselor Uji",
          avatarKey: null,
        },
      },
      zoomMeeting: null,
      ...overrides,
    };
  }

  it("chat aktif bila booking terkonfirmasi", () => {
    const dto = toSessionDto(session() as never, "patient");
    expect(dto.chat).toEqual({ enabled: true, readOnly: false });
    expect(dto.zoom).toBeNull();
  });

  it("chat read-only setelah sesi selesai", () => {
    const dto = toSessionDto(
      session({
        status: "completed",
        booking: {
          ...(session().booking as Record<string, unknown>),
          scheduledStart: new Date("2026-01-01T09:00:00.000Z"),
          scheduledEnd: new Date("2026-01-01T10:00:00.000Z"),
        },
      }) as never,
      "patient",
    );

    expect(dto.status).toBe("completed");
    expect(dto.chat).toEqual({ enabled: true, readOnly: true });
  });

  it("menampilkan joinUrl untuk pasien dan startUrl untuk konselor di dalam jendela", () => {
    const zoomMeeting = {
      id: "zoom-1",
      sessionId: "session-1",
      zoomMeetingId: "123",
      joinUrl: "https://zoom.test/j",
      startUrl: "https://zoom.test/s",
      startTime: start,
      durationMinutes: 60,
      integrationStatus: "created",
      attemptCount: 1,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };

    const base = session({
      booking: {
        ...(session().booking as Record<string, unknown>),
        method: "zoom",
        scheduledStart: new Date(Date.now() + 5 * 60_000),
        scheduledEnd: new Date(Date.now() + 65 * 60_000),
      },
      zoomMeeting,
    });

    const patientDto = toSessionDto(base as never, "patient");
    expect(patientDto.zoom).toMatchObject({
      joinUrl: "https://zoom.test/j",
      status: "created",
    });
    expect(patientDto.zoom).not.toHaveProperty("startUrl");

    const counselorDto = toSessionDto(base as never, "counselor");
    expect(counselorDto.zoom).toMatchObject({
      joinUrl: "https://zoom.test/j",
      startUrl: "https://zoom.test/s",
      lastError: null,
    });

    const adminDto = toSessionDto(base as never, "admin");
    expect(adminDto.zoom).toEqual({
      status: "created",
      attemptCount: 1,
      hasJoinUrl: true,
      hasStartUrl: true,
    });
  });

  it("menyembunyikan tautan Zoom sebelum jendela bergabung dibuka", () => {
    const zoomMeeting = {
      id: "zoom-1",
      sessionId: "session-1",
      zoomMeetingId: "123",
      joinUrl: "https://zoom.test/j",
      startUrl: "https://zoom.test/s",
      startTime: new Date(Date.now() + 60 * 60_000),
      durationMinutes: 60,
      integrationStatus: "created",
      attemptCount: 1,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };

    const base = session({
      booking: {
        ...(session().booking as Record<string, unknown>),
        method: "zoom",
      },
      zoomMeeting,
    });

    const patientDto = toSessionDto(base as never, "patient");
    expect(patientDto.zoom).toMatchObject({
      status: "created",
      joinable: false,
      joinUrl: null,
    });
    expect(patientDto.zoom).not.toHaveProperty("startUrl");

    const counselorDto = toSessionDto(base as never, "counselor");
    expect(counselorDto.zoom).toMatchObject({
      joinable: false,
      joinUrl: null,
      startUrl: null,
    });
  });

  it("menyembunyikan tautan Zoom setelah sesi berakhir", () => {
    const zoomMeeting = {
      id: "zoom-1",
      sessionId: "session-1",
      zoomMeetingId: "123",
      joinUrl: "https://zoom.test/j",
      startUrl: "https://zoom.test/s",
      startTime: new Date("2026-01-01T09:00:00.000Z"),
      durationMinutes: 60,
      integrationStatus: "created",
      attemptCount: 1,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };

    const dto = toSessionDto(
      session({
        booking: {
          ...(session().booking as Record<string, unknown>),
          method: "zoom",
          scheduledStart: new Date("2026-01-01T09:00:00.000Z"),
          scheduledEnd: new Date("2026-01-01T10:00:00.000Z"),
        },
        zoomMeeting,
      }) as never,
      "counselor",
    );

    expect(dto.zoom).toMatchObject({
      joinable: false,
      joinUrl: null,
      startUrl: null,
    });
  });

  it("zoom null bila meeting belum dibuat", () => {
    const dto = toSessionDto(
      session({
        booking: {
          ...(session().booking as Record<string, unknown>),
          method: "zoom",
        },
      }) as never,
      "patient",
    );

    expect(dto.zoom).toBeNull();
  });
});

describe("zoomJoinWindow", () => {
  const start = new Date("2026-01-15T09:00:00.000Z");
  const end = new Date("2026-01-15T10:00:00.000Z");

  it("membuka tautan 10 menit sebelum sesi dimulai", () => {
    expect(
      zoomJoinWindow(start, end, new Date("2026-01-15T08:49:59.000Z")).joinable,
    ).toBe(false);
    expect(
      zoomJoinWindow(start, end, new Date("2026-01-15T08:50:00.000Z")).joinable,
    ).toBe(true);
  });

  it("menutup tautan saat sesi berakhir", () => {
    expect(
      zoomJoinWindow(start, end, new Date("2026-01-15T09:59:59.000Z")).joinable,
    ).toBe(true);
    expect(
      zoomJoinWindow(start, end, new Date("2026-01-15T10:00:00.000Z")).joinable,
    ).toBe(false);
  });
});

describe("toMessageDto", () => {
  it("memetakan pesan dan pengirim", () => {
    const dto = toMessageDto({
      id: "message-1",
      sessionId: "session-1",
      senderId: "patient-1",
      content: "Halo",
      clientMessageId: "11111111-1111-4111-8111-111111111111",
      createdAt: now,
      sender: {
        id: "patient-1",
        fullName: "Pasien Uji",
        avatarKey: "avatars/patient.png",
      },
    } as never);

    expect(dto).toMatchObject({
      id: "message-1",
      content: "Halo",
      createdAt: now.toISOString(),
      sender: {
        id: "patient-1",
        fullName: "Pasien Uji",
        avatarUrl: "https://cdn.test.local/avatars/patient.png",
      },
    });
  });
});

describe("profile dan admin user DTO", () => {
  const profile = {
    id: "user-1",
    fullName: "Ayu",
    email: "ayu@example.com",
    role: "counselor",
    avatarKey: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  it("toProfileDto menyertakan counselorProfile", () => {
    const dto = toProfileDto({
      ...profile,
      counselorProfile: {
        counselorId: "user-1",
        specialization: "Kecemasan",
        bio: "Bio",
        createdAt: now,
        updatedAt: now,
      },
    } as never);

    expect(dto.counselorProfile?.specialization).toBe("Kecemasan");
  });

  it("toProfileDto counselorProfile null untuk pasien", () => {
    const dto = toProfileDto({ ...profile, counselorProfile: null } as never);
    expect(dto.counselorProfile).toBeNull();
  });

  it("toAdminUserDto tidak menyertakan counselorProfile", () => {
    const dto = toAdminUserDto(profile as never);
    expect(dto).not.toHaveProperty("counselorProfile");
    expect(dto.avatarUrl).toBeNull();
  });
});

describe("paginated", () => {
  it("menghitung totalPages", () => {
    expect(paginated([1, 2], 45, 2, 20)).toEqual({
      items: [1, 2],
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("minimal satu halaman untuk data kosong", () => {
    expect(paginated([], 0, 1, 20).totalPages).toBe(1);
  });
});
