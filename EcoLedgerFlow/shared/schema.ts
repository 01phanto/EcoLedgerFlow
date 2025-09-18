import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'ngo', 'buyer', 'admin'
  organizationName: text("organization_name"),
});

export const plantations = pgTable("plantations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ngoId: varchar("ngo_id").notNull().references(() => users.id),
  mangroveCount: integer("mangrove_count").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
  notes: text("notes"),
  imageUrl: text("image_url"),
  creditsEarned: integer("credits_earned").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'verified', 'rejected'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
});

export const credits = pgTable("credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantationId: varchar("plantation_id").notNull().references(() => plantations.id),
  ngoId: varchar("ngo_id").notNull().references(() => users.id),
  currentOwnerId: varchar("current_owner_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  pricePerCredit: decimal("price_per_credit", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("available"), // 'available', 'sold'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionHash: text("transaction_hash").notNull().unique(),
  type: text("type").notNull(), // 'mint', 'transfer'
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  creditId: varchar("credit_id").references(() => credits.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("confirmed"), // 'pending', 'confirmed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertPlantationSchema = createInsertSchema(plantations).omit({
  id: true,
  creditsEarned: true,
  createdAt: true,
  verifiedAt: true,
  verifiedBy: true,
});

export const insertCreditSchema = createInsertSchema(credits).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlantation = z.infer<typeof insertPlantationSchema>;
export type Plantation = typeof plantations.$inferSelect;
export type InsertCredit = z.infer<typeof insertCreditSchema>;
export type Credit = typeof credits.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
