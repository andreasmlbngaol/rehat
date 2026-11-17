export const ERROR_STATUS = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  EMAIL_NOT_VERIFIED: 403,
  ACCOUNT_INACTIVE: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SLOT_UNAVAILABLE: 409,
  BOOKING_NOT_PAYABLE: 409,
  PAYMENT_ALREADY_SUCCESS: 409,
  SESSION_NOT_ACTIVE: 409,
  RATE_LIMITED: 429,
  EXTERNAL_SERVICE_ERROR: 502,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly errors: FieldErrors | null;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { errors?: FieldErrors; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.errors = options?.errors ?? null;
  }
}

export const errors = {
  validation: (fieldErrors: FieldErrors, message = "Data yang dikirim tidak valid.") =>
    new AppError("VALIDATION_ERROR", message, { errors: fieldErrors }),

  unauthenticated: (message = "Sesi tidak ditemukan atau sudah berakhir.") =>
    new AppError("UNAUTHENTICATED", message),

  emailNotVerified: (message = "Verifikasi email Anda terlebih dahulu.") =>
    new AppError("EMAIL_NOT_VERIFIED", message),

  accountInactive: (message = "Akun Anda tidak aktif. Hubungi administrator.") =>
    new AppError("ACCOUNT_INACTIVE", message),

  forbidden: (message = "Anda tidak memiliki akses ke data ini.") =>
    new AppError("FORBIDDEN", message),

  notFound: (message = "Data tidak ditemukan.") =>
    new AppError("NOT_FOUND", message),

  conflict: (message = "Permintaan bertentangan dengan data yang sudah ada.") =>
    new AppError("CONFLICT", message),

  slotUnavailable: (message = "Jadwal yang dipilih sudah tidak tersedia.") =>
    new AppError("SLOT_UNAVAILABLE", message),

  bookingNotPayable: (message = "Pemesanan ini tidak dapat dibayar lagi.") =>
    new AppError("BOOKING_NOT_PAYABLE", message),

  paymentAlreadySuccess: (message = "Pemesanan ini sudah dibayar.") =>
    new AppError("PAYMENT_ALREADY_SUCCESS", message),

  sessionNotActive: (message = "Pesan hanya dapat dikirim selama sesi berlangsung.") =>
    new AppError("SESSION_NOT_ACTIVE", message),

  rateLimited: (message = "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.") =>
    new AppError("RATE_LIMITED", message),

  external: (message = "Layanan eksternal sedang tidak tersedia. Coba lagi nanti.") =>
    new AppError("EXTERNAL_SERVICE_ERROR", message),

  internal: (message = "Terjadi kesalahan pada server.") =>
    new AppError("INTERNAL_ERROR", message),
};

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
