// TypeScript mirrors of the backend DTOs. Amounts are BigDecimal server-side, serialized as
// JSON numbers.

/** A vehicle type code, e.g. "MINI_TRUCK". The set lives in the database, not here. */
export type VehicleTier = string;

/** A bookable vehicle type, managed by ops on /vehicle-types. */
export interface VehicleType {
  id: string;
  code: string;
  label: string;
  capacity: string;
  blurb: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export type BookingStatus =
  | "NEW"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type StaffRole = "ADMIN" | "OPS";
export type DriverStatus = "PENDING" | "VERIFIED" | "SUSPENDED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PayoutStatus = "PENDING" | "SENT" | "FAILED";

export interface PageMeta {
  nextCursor: string | null;
  hasNext: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface LoginResponse {
  token: string;
  expiresInSeconds: number;
  staff: { id: string; name: string; email: string; role: StaffRole };
}

export interface BookingRow {
  id: string;
  reference: string;
  customerName: string;
  tier: VehicleTier;
  status: BookingStatus;
  pickupText: string;
  dropoffText: string;
  quotedPrice: number | null;
  assignedDriverName: string | null;
  createdAt: string;
  /** Null until the customer starts paying. NEW + not PAID = awaiting payment; nothing dispatches. */
  paymentStatus?: PaymentStatus | null;
}

export interface Party {
  id: string;
  name: string;
  phone: string;
}

export interface Place {
  text: string;
  lat: number | null;
  lng: number | null;
}

export interface StatusEvent {
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
}

export interface BookingDetail {
  id: string;
  reference: string;
  customer: Party;
  tier: VehicleTier;
  status: BookingStatus;
  pickup: Place;
  dropoff: Place;
  distanceKm: number | null;
  quotedPrice: number | null;
  notes: string | null;
  driver: Party | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  statusHistory: StatusEvent[];
  receiverName?: string | null;
  receiverPhone?: string | null;
  goodsType?: string | null;
  scheduledAt?: string | null;
  driverEarning?: number | null;
  rating?: number | null;
  ratingComment?: string | null;
  awaitingAcceptance?: boolean;
  /** Receiver tracking page (no login); null until a driver is assigned. */
  shareUrl?: string | null;
}

export interface QuoteResult {
  tier: VehicleTier;
  zone: string;
  distanceKm: number;
  price: number;
  rateCardId: string;
  /** base covers the first includedKm; extraKm is what was charged per-km on top. */
  breakdown: { baseFare: number; perKm: number; includedKm: number; extraKm: number };
}

/** A customer's account dashboard (GET /customer/dashboard, GET /customers/{id}/dashboard). */
export interface CustomerDashboard {
  from: string;
  to: string;
  trips: number;
  completed: number;
  cancelled: number;
  active: number;
  spend: number;
  avgFare: number;
  byDay: { date: string; trips: number; spend: number }[];
  byTier: { tier: VehicleTier; trips: number; spend: number }[];
}

/** Phone + OTP sign-in for the business portal. */
export interface CustomerSession {
  token: string;
  expiresInSeconds: number;
  customer: { id: string; name: string; phone: string };
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  type: "INDIVIDUAL" | "BUSINESS";
  businessName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VehicleView {
  id: string;
  driverId: string;
  tier: VehicleTier;
  plate: string;
  makeModel: string | null;
  capacityKg: number | null;
  isActive: boolean;
}

export interface DriverRow {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  momoNumber: string | null;
  createdAt: string;
}

export interface DriverDetail {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  momoNumber: string | null;
  notes: string | null;
  createdAt: string;
  vehicles: VehicleView[];
}

export interface RateCard {
  id: string;
  tier: VehicleTier;
  zone: string;
  baseFare: number;
  perKm: number;
  /** Km the base fare includes; per-km applies beyond. */
  includedKm: number;
  takeRatePct: number;
  active: boolean;
  effectiveFrom: string;
}

/** The customer's payment for a booking. PAID comes only from the provider webhook or an admin record. */
export interface PaymentView {
  id: string;
  bookingId: string;
  /** Our reference, echoed by the provider's webhook. */
  reference: string;
  amount: number;
  takeRatePct: number;
  commissionAmount: number;
  driverPayout: number;
  status: PaymentStatus;
  /** The provider's transaction id. */
  providerRef: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  refundedAt: string | null;
  /** True while MoMo is simulated (MTN sandbox pending): the prompt confirms itself in seconds. */
  simulated?: boolean;
}

/** Money sent to a driver against their ledger balance. */
export interface Payout {
  id: string;
  driverId: string;
  driverName: string;
  amount: number;
  status: PayoutStatus;
  providerRef: string | null;
  sentAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface DailyMetrics {
  date: string;
  bookings: number;
  completed: number;
  cancelled: number;
  gbv: number;
  paidCount: number;
  collected: number;
  commission: number;
  driverPayout: number;
}

export type LedgerEntryKind = "TRIP_EARNING" | "PAYOUT" | "ADJUSTMENT";

/** One signed movement on a driver's ledger. Append-only; the balance is the sum. */
export interface LedgerEntry {
  id: string;
  kind: LedgerEntryKind;
  amount: number;
  bookingId: string | null;
  payoutId: string | null;
  note: string | null;
  createdAt: string;
}

export interface EarningsSummary {
  from: string;
  to: string;
  trips: number;
  gross: number;
  commission: number;
  driverShare: number;
}

/** A driver's earnings: the window summary, and the ledger that backs the balance. */
export interface DriverEarnings {
  driverId: string;
  summary: EarningsSummary;
  balance: number;
  minBalance: number;
  ledger: LedgerEntry[];
}

export interface IssueView {
  id: string;
  bookingId: string;
  bookingReference: string | null;
  reportedBy: "CUSTOMER" | "DRIVER";
  category: string;
  message: string;
  status: "OPEN" | "RESOLVED";
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
