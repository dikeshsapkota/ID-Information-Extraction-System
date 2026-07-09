import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const citizens = pgTable("citizens", {
  id: serial().primaryKey(),
  fullText: text("full_text").notNull(),
  name: text().notNull(),
  idNumber: text("id_number").notNull(),
  dob: text().notNull(),
  gender: text().notNull().default("Not detected"),
  district: text().notNull().default("Not detected"),
  municipality: text().notNull().default("Not detected"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
