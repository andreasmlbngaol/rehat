import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { paginationSchema } from "@/lib/validation/common";
import { listPaymentsForPatient } from "@/lib/services/payment.service";
import { toPaymentDto } from "@/lib/dto/payment";
import { paginated } from "@/lib/dto/pagination";

export const GET = apiRoute(
  { auth: "required", roles: ["patient"] },
  async ({ searchParams, user }) => {
    const query = parseQuery(paginationSchema, searchParams);

    const { items, total } = await listPaymentsForPatient({
      patientId: user!.id,
      page: query.page,
      limit: query.limit,
    });

    return ok(
      paginated(
        items.map((payment) => toPaymentDto(payment)),
        total,
        query.page,
        query.limit,
      ),
    );
  },
);
