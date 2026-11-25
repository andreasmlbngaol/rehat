import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseBody, parseParam, readJson } from "@/lib/api/validation";
import { uuidSchema } from "@/lib/validation/common";
import { updateTimeSlotSchema } from "@/lib/validation/time-slot";
import {
  deleteTimeSlot,
  toTimeSlotDto,
  updateTimeSlot,
} from "@/lib/services/time-slot.service";

export const PATCH = apiRoute<{ id: string }>(
  { auth: "required", roles: ["counselor"] },
  async ({ request, params, user }) => {
    const id = parseParam(uuidSchema, params.id);
    const input = parseBody(updateTimeSlotSchema, await readJson(request));

    const slot = await updateTimeSlot({
      id,
      counselorId: user!.id,
      startTime: input.startTime,
      serviceId: input.serviceId,
      durationMinutes: input.durationMinutes,
    });

    return ok(toTimeSlotDto(slot), "Slot jadwal berhasil diperbarui.");
  },
);

export const DELETE = apiRoute<{ id: string }>(
  { auth: "required", roles: ["counselor"] },
  async ({ params, user }) => {
    const id = parseParam(uuidSchema, params.id);
    await deleteTimeSlot({ id, counselorId: user!.id });

    return ok(null, "Slot jadwal berhasil dihapus.");
  },
);
