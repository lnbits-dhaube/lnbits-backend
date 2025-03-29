import express, { Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import bcrypt from "bcrypt";
import { users, roles, wallets } from "../db/schema";
import { db } from "../db"; // Assuming you have a database connection file
import { eq } from "drizzle-orm"; // Ensure this is imported correctly

const rolesRouter = express.Router();

// Get list of roles
rolesRouter.get(
  "/roles",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      const rolesList = await db
        .select({
          id: roles.id,
          name: roles.name,
        })
        .from(roles)
        .execute();

      res.json(rolesList);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default rolesRouter;
