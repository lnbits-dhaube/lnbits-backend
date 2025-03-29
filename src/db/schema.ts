import { relations } from "drizzle-orm";
import { mysqlTable, serial, varchar, int } from "drizzle-orm/mysql-core";

export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(),
});

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  pin: varchar("pin", { length: 4 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: int("role_id")
    .notNull()
    .references(() => roles.id),
});

export const wallets = mysqlTable("wallets", {
  id: int("id").primaryKey().autoincrement(),
  identificationId: varchar("identification_id", { length: 100 })
    .notNull()
    .unique(),
  walletId: varchar("wallet_id", { length: 100 }).notNull(),
  apiKey: varchar("api_key", { length: 100 }).notNull(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
});

// Define relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));
