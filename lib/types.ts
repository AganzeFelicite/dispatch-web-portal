// TypeScript mirrors of the backend DTOs. Amounts are BigDecimal server-side, serialized as
// JSON numbers.

export type VehicleTier = "MOTO" | "CARGO_MOTO" | "PICKUP" | "MINI_TRUCK";

export type BookingStatus =
  | "NEW"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type StaffRole = "ADMIN" | "OPS";
export type DriverStatus = "PENDING" | "VERIFIED" | "SUSPENDED";
export type PaymentMethod = "MOMO" | "CASH";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PayoutStatus = "PENDING" | "SENT" | "FAILED";

export const TIERS: VehicleTier[] = ["MOTO", "CARGO_MOTO", "PICKUP", "MINI_TRUCK"];

/** Customer-facing names + capacity lines, kept identical to mobile/lib/core/vehicle.dart. */
export const TIER_META: Record<VehicleTier, { label: string; capacity: string }> = {
  MOTO: { label: "Moto", capacity: "up to 20 kg" },
  CARGO_MOTO: { label: "Cargo moto", capacity: "up to 100 kg" },
  PICKUP: { label: "Pickup", capacity: "up to 800 kg" },
  MINI_TRUCK: { label: "Mini truck", capacity: "up to 2 tonnes" },
};

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
  paymentMethod?: string;
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
  breakdown: { baseFare: number; perKm: number; minFare: number; applied: string };
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
  minFare: number;
  takeRatePct: number;
  active: boolean;
  effectiveFrom: string;
}

export interface PaymentView {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  amount: number;
  commissionAmount: number;
  driverPayout: number;
  status: PaymentStatus;
  providerRef: string | null;
  paidAt: string | null;
}

export interface Payout {
  id: string;
  driverId: string;
  driverName: string;
  bookingId: string | null;
  bookingReference: string | null;
  amount: number;
  status: PayoutStatus;
  providerRef: string | null;
  sentAt: string | null;
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

export type WalletEntryKind = "TRIP_EARNING" | "CASH_COMMISSION" | "WITHDRAWAL" | "RECHARGE" | "ADJUSTMENT";

export interface WalletEntry {
  id: string;
  kind: WalletEntryKind;
  amount: number;
  bookingId: string | null;
  note: string | null;
  createdAt: string;
}

/** Driver wallet (Porter-style settlement): balance = sum of signed entries. */
export interface WalletView {
  balance: number;
  minBalance: number;
  entries: WalletEntry[];
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
