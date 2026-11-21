import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, parseParam, parseQuery, readJson } from "@/lib/api/validation";
import {
  bookingListQuerySchema,
  createBookingSchema,
  idempotencyKeySchema,
} from "@/lib/validation/booking";
import { prisma } from "@/lib/prisma";
import {
  bookingInclude,
  createBooking,
  expireStaleBookings,
} from "@/lib/services/booking.service";
import { toBookingDto } from "@/lib/dto/booking";
import { paginated } from "@/lib/dto/pagination";

export const POST = apiRoute(
  { auth: "required", roles: ["patient"] },
  async ({ request, user }) => {
    const idempotencyKey = parseParam(
      idempotencyKeySchema,
      request.headers.get("idempotency-key") ?? "",
      "Idempotency-Key",
    );

    const input = parseBody(createBookingSchema, await readJson(request));

    const booking = await createBooking({
      patientId: user!.id,
      timeSlotId: input.timeSlotId,
      serviceId: input.serviceId,
      method: input.method,
      idempotencyKey,
    });

    return ok(
      toBookingDto(booking, user!.role),
      "Pemesanan berhasil dibuat. Selesaikan pembayaran sebelum batas waktu.",
      201,
    );
  },
);

export const GET = apiRoute({ auth: "required" }, async ({ searchParams, user }) => {
  await expireStaleBookings();

  const query = parseQuery(bookingListQuerySchema, searchParams);

  const where = {
    ...(user!.role === "patient" ? { patientId: user!.id } : {}),
    ...(user!.role === "counselor" ? { counselorId: user!.id } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.method ? { method: query.method } : {}),
    ...(query.q
      ? { bookingCode: { contains: query.q, mode: "insensitive" as const } }
      : {}),
    ...(query.from || query.to
      ? {
          scheduledStart: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return ok(
    paginated(
      items.map((booking) => toBookingDto(booking, user!.role)),
      total,
      query.page,
      query.limit,
    ),
  );
});
