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
} from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type Attraction = typeof attractions.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
