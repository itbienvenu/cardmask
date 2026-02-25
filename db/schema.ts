import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),

    phone: varchar("phone", { length: 50 }),
    phoneVerified: boolean("phone_verified").default(false),
    dateOfBirth: varchar("date_of_birth", { length: 50 }), // YYYY-MM-DD
    physicalAddress: text("physical_address"),

    // Advanced KYC / Identity Verification
    idDocumentFront: text("id_document_front"), // URL to the uploaded front ID image
    idDocumentBack: text("id_document_back"),   // URL to the uploaded back ID image
    kycStatus: varchar("kyc_status", { length: 50 }).default("UNVERIFIED").notNull(), // UNVERIFIED, PENDING, APPROVED, REJECTED

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fundingSources = pgTable("funding_sources", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),

    cardholderName: varchar("cardholder_name", { length: 255 }).notNull(),
    last4: varchar("last4", { length: 4 }).notNull(),
    network: varchar("network", { length: 50 }).notNull(),
    vaultToken: text("vault_token").notNull(),
    expiryMonth: integer("expiry_month").notNull(),
    expiryYear: integer("expiry_year").notNull(),
    billingZipCode: varchar("billing_zip_code", { length: 20 }),

    status: varchar("status", { length: 50 }).default("ACTIVE").notNull(),
    availableBalance: integer("available_balance").default(0), // Only for testing simulator
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const maskCards = pgTable("mask_cards", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    fundingSourceId: uuid("funding_source_id").references(() => fundingSources.id, { onDelete: 'cascade' }).notNull(),

    pan: varchar("pan", { length: 20 }).notNull(),
    cvv: varchar("cvv", { length: 10 }).notNull(),
    expiryMonth: integer("expiry_month").notNull(),
    expiryYear: integer("expiry_year").notNull(),

    status: varchar("status", { length: 50 }).default("ACTIVE").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // ONE_TIME, RECURRING, MERCHANT_LOCKED

    limitAmount: integer("limit_amount").notNull(),
    spentAmount: integer("spent_amount").default(0).notNull(),
    useCases: jsonb("use_cases").$type<string[]>().default([]).notNull(), // Stores array of allowed merchants

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    maskCardId: uuid("mask_card_id").references(() => maskCards.id, { onDelete: 'cascade' }).notNull(),

    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 10 }).default("RWF").notNull(),
    merchant: varchar("merchant", { length: 255 }).notNull(),

    status: varchar("status", { length: 50 }).notNull(), // PENDING, SUCCESS, DECLINED, REFUNDED
    failureReason: text("failure_reason"),

    timestamp: timestamp("timestamp").defaultNow().notNull(),
});
