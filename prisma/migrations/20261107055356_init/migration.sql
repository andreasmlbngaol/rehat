-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('patient', 'counselor', 'admin');

-- CreateEnum
CREATE TYPE "CounselingMethod" AS ENUM ('chat', 'zoom');

-- CreateEnum
CREATE TYPE "TimeSlotStatus" AS ENUM ('available', 'held', 'booked');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending_payment', 'confirmed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'success', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'active', 'completed');

-- CreateEnum
CREATE TYPE "ZoomIntegrationStatus" AS ENUM ('pending', 'created', 'failed');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'patient',
    "avatar_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselor_profiles" (
    "counselor_id" UUID NOT NULL,
    "specialization" TEXT NOT NULL,
    "bio" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "counselor_profiles_pkey" PRIMARY KEY ("counselor_id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_methods" (
    "service_id" UUID NOT NULL,
    "method" "CounselingMethod" NOT NULL,

    CONSTRAINT "service_methods_pkey" PRIMARY KEY ("service_id","method")
);

-- CreateTable
CREATE TABLE "counselor_services" (
    "counselor_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,

    CONSTRAINT "counselor_services_pkey" PRIMARY KEY ("counselor_id","service_id")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" UUID NOT NULL,
    "counselor_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "start_time" TIMESTAMPTZ(3) NOT NULL,
    "end_time" TIMESTAMPTZ(3) NOT NULL,
    "status" "TimeSlotStatus" NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_code" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "counselor_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "time_slot_id" UUID NOT NULL,
    "method" "CounselingMethod" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending_payment',
    "payment_expires_at" TIMESTAMPTZ(3),
    "idempotency_key" UUID NOT NULL,
    "service_name" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "scheduled_start" TIMESTAMPTZ(3) NOT NULL,
    "scheduled_end" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "midtrans_order_id" TEXT NOT NULL,
    "snap_token" TEXT,
    "midtrans_transaction_id" TEXT,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "payment_type" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "transaction_time" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "payment_id" UUID,
    "midtrans_order_id" TEXT NOT NULL,
    "transaction_status" TEXT,
    "signature_valid" BOOLEAN NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "event_hash" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_sessions" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'scheduled',
    "started_at" TIMESTAMPTZ(3),
    "ended_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "counseling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "client_message_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zoom_meetings" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "zoom_meeting_id" TEXT,
    "join_url" TEXT,
    "start_url" TEXT,
    "start_time" TIMESTAMPTZ(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "integration_status" "ZoomIntegrationStatus" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "zoom_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_role_is_active_idx" ON "profiles"("role", "is_active");

-- CreateIndex
CREATE INDEX "services_is_active_idx" ON "services"("is_active");

-- CreateIndex
CREATE INDEX "counselor_services_service_id_idx" ON "counselor_services"("service_id");

-- CreateIndex
CREATE INDEX "time_slots_counselor_id_start_time_idx" ON "time_slots"("counselor_id", "start_time");

-- CreateIndex
CREATE INDEX "time_slots_status_start_time_idx" ON "time_slots"("status", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings"("idempotency_key");

-- CreateIndex
CREATE INDEX "bookings_patient_id_created_at_idx" ON "bookings"("patient_id", "created_at");

-- CreateIndex
CREATE INDEX "bookings_counselor_id_scheduled_start_idx" ON "bookings"("counselor_id", "scheduled_start");

-- CreateIndex
CREATE INDEX "bookings_status_payment_expires_at_idx" ON "bookings"("status", "payment_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_midtrans_order_id_key" ON "payments"("midtrans_order_id");

-- CreateIndex
CREATE INDEX "payments_booking_id_status_idx" ON "payments"("booking_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_event_hash_key" ON "payment_webhook_events"("event_hash");

-- CreateIndex
CREATE INDEX "payment_webhook_events_midtrans_order_id_idx" ON "payment_webhook_events"("midtrans_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "counseling_sessions_booking_id_key" ON "counseling_sessions"("booking_id");

-- CreateIndex
CREATE INDEX "counseling_sessions_status_idx" ON "counseling_sessions"("status");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_created_at_idx" ON "chat_messages"("session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_session_id_client_message_id_key" ON "chat_messages"("session_id", "client_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "zoom_meetings_session_id_key" ON "zoom_meetings"("session_id");

-- AddForeignKey
ALTER TABLE "counselor_profiles" ADD CONSTRAINT "counselor_profiles_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_methods" ADD CONSTRAINT "service_methods_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselor_services" ADD CONSTRAINT "counselor_services_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselor_services" ADD CONSTRAINT "counselor_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "counseling_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zoom_meetings" ADD CONSTRAINT "zoom_meetings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "counseling_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
