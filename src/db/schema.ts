import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  date,
  customType,
  bigint,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export type RoomOption = {
  id: string;
  title: string;
  price: number;
  unit: "per_night" | "per_person_night" | "per_stay" | "per_person";
  included: boolean;
};

export type SelectedOption = { id: string; title: string; unit: RoomOption["unit"]; price: number; amount: number };

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  roomNumber: text("room_number").notNull().default(""),
  type: text("type").notNull().default("دبل"),
  floor: integer("floor").notNull().default(1),
  capacity: integer("capacity").notNull().default(2),
  extraBeds: integer("extra_beds").notNull().default(0),
  beds: text("beds").notNull().default(""),
  size: integer("size").notNull().default(25),
  view: text("view").notNull().default(""),
  pricePerNight: integer("price_per_night").notNull().default(0),
  holidayPrice: integer("holiday_price").notNull().default(0),
  peakPrice: integer("peak_price").notNull().default(0),
  extraGuestPrice: integer("extra_guest_price").notNull().default(0),
  options: jsonb("options").$type<RoomOption[]>().notNull().default([]),
  shortDescription: text("short_description").notNull().default(""),
  description: text("description").notNull().default(""),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  videoUrl: text("video_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull().default("Sparkles"),
  shortDescription: text("short_description").notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  videoUrl: text("video_url").notNull().default(""),
  price: integer("price").notNull().default(0),
  priceUnit: text("price_unit").notNull().default("هر سانس"),
  workingHours: text("working_hours").notNull().default(""),
  rules: jsonb("rules").$type<string[]>().notNull().default([]),
  timeSlots: jsonb("time_slots").$type<string[]>().notNull().default([]),
  slotPrices: jsonb("slot_prices").$type<Record<string, number>>().notNull().default({}),
  includedGuests: integer("included_guests").notNull().default(4),
  extraGuestPrice: integer("extra_guest_price").notNull().default(0),
  maxGuests: integer("max_guests").notNull().default(6),
  isBookable: boolean("is_bookable").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  icon: text("icon").notNull().default("Sparkles"),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("عمومی"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attractions = pgTable("attractions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("طبیعی"),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  distanceKm: doublePrecision("distance_km").notNull().default(0),
  travelTime: text("travel_time").notNull().default(""),
  lat: doublePrecision("lat").notNull().default(0),
  lng: doublePrecision("lng").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ReservationStatus =
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "rejected"
  | "cancelled";

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  trackingCode: text("tracking_code").notNull().unique(),
  reservationCode: text("reservation_code").unique(),
  kind: text("kind").$type<"room" | "service">().notNull(),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "set null" }),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull().default(""),
  guestName: text("guest_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  nationalId: text("national_id").notNull().default(""),
  guests: integer("guests").notNull().default(1),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out"),
  timeSlot: text("time_slot").notNull().default(""),
  nights: integer("nights").notNull().default(1),
  totalPrice: integer("total_price").notNull().default(0),
  extraGuestFee: integer("extra_guest_fee").notNull().default(0),
  options: jsonb("options").$type<SelectedOption[]>().notNull().default([]),
  optionsTotal: integer("options_total").notNull().default(0),
  nightly: jsonb("nightly").$type<{ date: string; price: number; kind: string }[]>().notNull().default([]),
  settledAt: timestamp("settled_at"),
  depositAmount: integer("deposit_amount").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default(""),
  paymentRef: text("payment_ref").notNull().default(""),
  paidAt: timestamp("paid_at"),
  status: text("status").$type<ReservationStatus>().notNull().default("pending_payment"),
  notes: text("notes").notNull().default(""),
  adminNote: text("admin_note").notNull().default(""),
  smsStatus: text("sms_status").notNull().default(""),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull().default(""),
  rating: integer("rating").notNull().default(5),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const uploads = pgTable("uploads", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaFiles = pgTable("media_files", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  name: text("name").notNull().default(""),
  size: integer("size").notNull().default(0),
  data: bytea("data").notNull(),
  chunkSize: integer("chunk_size").notNull().default(0),
  complete: boolean("complete").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaChunks = pgTable(
  "media_chunks",
  {
    fileId: text("file_id")
      .notNull()
      .references(() => mediaFiles.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    data: bytea("data").notNull(),
  },
  (t) => [primaryKey({ columns: [t.fileId, t.idx] })],
);

/* ---------- pricing calendar ---------- */
export const roomRates = pgTable(
  "room_rates",
  {
    roomId: integer("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    price: integer("price").notNull(),
  },
  (t) => [primaryKey({ columns: [t.roomId, t.date] })],
);

export const calendarDays = pgTable("calendar_days", {
  date: date("date").primaryKey(),
  kind: text("kind").$type<"holiday" | "peak">().notNull(),
  title: text("title").notNull().default(""),
});

/* ---------- security ---------- */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
});

export const smsLogs = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  receptor: text("receptor").notNull(),
  event: text("event").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  response: text("response").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ---------- double-entry accounting ---------- */
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  level: integer("level").notNull(), // 1 = کل، 2 = معین، 3 = تفصیلی
  parentId: integer("parent_id"),
  type: text("type").$type<AccountType>().notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    description: text("description").notNull().default(""),
    source: text("source").notNull().default("manual"), // manual | income | expense | reservation
    sourceType: text("source_type").notNull().default(""), // deposit | revenue | refund | settlement
    reservationId: integer("reservation_id"),
    createdBy: text("created_by").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("je_date_idx").on(t.date), index("je_res_idx").on(t.reservationId)],
);

export const journalLines = pgTable(
  "journal_lines",
  {
    id: serial("id").primaryKey(),
    entryId: integer("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id),
    debit: bigint("debit", { mode: "number" }).notNull().default(0),
    credit: bigint("credit", { mode: "number" }).notNull().default(0),
    description: text("description").notNull().default(""),
  },
  (t) => [index("jl_entry_idx").on(t.entryId), index("jl_account_idx").on(t.accountId)],
);

export type Account = typeof accounts.$inferSelect;

export type Room = typeof rooms.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type Attraction = typeof attractions.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
