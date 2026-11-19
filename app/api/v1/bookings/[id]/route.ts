import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseParam } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { expireStaleBookings, findBookingForViewer } from "@/lib/services/booking.service";
import { toBookingDto } from "@/lib/dto/booking";

export const GET = apiRoute<{ id: string }>(
  { auth: "required" },
  async ({ params, user }) => {
    await expireStaleBookings();

    const id = parseParam(uuidSchema, params.id);
    const booking = await findBookingForViewer(id, user!);

    return ok(toBookingDto(booking, user!.role));
  },
);
