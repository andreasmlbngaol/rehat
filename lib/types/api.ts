export type UserRole = "patient" | "counselor" | "admin";
export type CounselingMethod = "chat" | "zoom";
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "expired";
export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "expired";
export type SessionStatus = "scheduled" | "active" | "completed";
export type TimeSlotStatus = "available" | "held" | "booked";
export type ZoomIntegrationStatus = "pending" | "created" | "failed";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarKey: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  counselorProfile: {
    specialization: string;
    bio: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  methods: CounselingMethod[];
  createdAt: string;
  updatedAt: string;
};

export type Counselor = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  specialization: string | null;
  bio: string | null;
  services: Array<{ id: string; name: string }>;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TimeSlot = {
  id: string;
  counselorId: string;
  startTime: string;
  endTime: string;
  status: TimeSlotStatus;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  method: CounselingMethod;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  price: number;
  scheduledStart: string;
  scheduledEnd: string;
  paymentExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient: { id: string; fullName: string; avatarUrl: string | null };
  counselor: { id: string; fullName: string; avatarUrl: string | null };
  payment: {
    id?: string;
    status: PaymentStatus;
    grossAmount?: number;
    paymentType?: string | null;
    transactionTime?: string | null;
    expiresAt?: string | null;
  } | null;
  session: {
    id: string;
    status: SessionStatus;
    startedAt: string | null;
    endedAt: string | null;
  } | null;
};

export type Payment = {
  id: string;
  midtransOrderId: string;
  status: PaymentStatus;
  grossAmount: number;
  paymentType: string | null;
  transactionTime: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  snapToken?: string;
  booking?: {
    id: string;
    bookingCode: string;
    serviceName: string;
    scheduledStart: string;
  };
  patient?: { id: string; fullName: string };
};

export type PaymentAttempt = {
  paymentId: string;
  midtransOrderId: string;
  snapToken: string;
  redirectUrl: string | null;
  grossAmount: number;
  expiresAt: string | null;
};

export type ZoomMeeting = {
  status: ZoomIntegrationStatus;
  joinable?: boolean;
  opensAt?: string;
  closesAt?: string;
  joinUrl?: string | null;
  startUrl?: string | null;
  startTime?: string;
  durationMinutes?: number;
  attemptCount?: number;
  lastError?: string | null;
  hasJoinUrl?: boolean;
  hasStartUrl?: boolean;
};

export type CounselingSession = {
  id: string;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingCode: string;
    serviceName: string;
    method: CounselingMethod;
    durationMinutes: number;
    scheduledStart: string;
    scheduledEnd: string;
    status: BookingStatus;
  };
  patient: { id: string; fullName: string; avatarUrl: string | null };
  counselor: { id: string; fullName: string; avatarUrl: string | null };
  zoom: ZoomMeeting | null;
  chat: { enabled: boolean; readOnly: boolean } | null;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  clientMessageId: string;
  createdAt: string;
  sender: { id: string; fullName: string; avatarUrl: string | null };
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminStats = {
  services: { total: number; active: number };
  counselors: { total: number; active: number };
  patients: { total: number };
  bookings: {
    total: number;
    pendingPayment: number;
    confirmed: number;
    cancelled: number;
    expired: number;
  };
  payments: {
    total: number;
    pending: number;
    success: number;
    failed: number;
    cancelled: number;
    expired: number;
    revenue: number;
  };
  sessions: {
    total: number;
    scheduled: number;
    active: number;
    completed: number;
  };
  zoomMeetings: {
    total: number;
    pending: number;
    created: number;
    failed: number;
  };
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  counselorProfile?: { specialization: string; bio: string | null } | null;
  stats?: {
    bookingsAsPatient: number;
    bookingsAsCounselor: number;
  };
};
