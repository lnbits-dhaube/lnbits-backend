import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { roles } from "./schema";
import { eq, or } from "drizzle-orm/expressions";

export const db = drizzle(process.env.DATABASE_URL || "");

async function main() {
  // Check if roles already exist
  const existingRoles = await db
    .select()
    .from(roles)
    .where(or(eq(roles.name, "SUPER_ADMIN"), eq(roles.name, "ADMIN"))) // Use 'or' function
    .execute();

  if (existingRoles.length === 0) {
    // Seed roles table
    await db.insert(roles).values([{ name: "SUPER_ADMIN" }, { name: "ADMIN" }]);
    console.log("Roles seeded successfully.");
  } else {
    console.log("Roles already exist. Skipping seeding.");
  }
}

main().catch((err) => {
  console.error("Error seeding database:", err);
});
