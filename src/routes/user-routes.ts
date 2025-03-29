import express, { Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import bcrypt from "bcrypt";
import { users, roles, wallets } from "../db/schema";
import { db } from "../db"; // Assuming you have a database connection file
import { eq } from "drizzle-orm"; // Ensure this is imported correctly
import { v4 as uuidv4 } from "uuid"; // Add this import for UUID generation

const userRouter = express.Router();

// Create a new user
userRouter.post(
  "/users",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    const { username, email, phone, pin, password, roleId, walletId, apiKey } =
      req.body;

    // Validation
    if (
      !username ||
      !email ||
      !phone ||
      !pin ||
      !password ||
      !roleId ||
      !walletId ||
      !apiKey
    ) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the new user
      const newUser = await db
        .insert(users)
        .values({
          username,
          email,
          phone,
          pin,
          password: hashedPassword,
          roleId,
        })
        .execute();

      const userId = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, phone))
        .execute()
        .then((result) => result[0]?.id); // Retrieve the inserted user's ID

      // Create the wallet for the new user
      await db
        .insert(wallets)
        .values({
          apiKey,
          walletId,
          userId,
          identificationId: uuidv4(), // Generate and add a UUID
        })
        .execute();

      res.status(201).json({
        message: "User and wallet created successfully",
        user: newUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Read all users
userRouter.get(
  "/users",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      const adminUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phone: users.phone,
          walletId: wallets.walletId, // Include walletId in the response
          apiKey: wallets.apiKey, // Include walletId in the response
        })
        .from(users)
        .leftJoin(roles, eq(roles.id, users.roleId))
        .leftJoin(wallets, eq(wallets.userId, users.id)) // Join with wallets table
        .where(eq(roles.name, "ADMIN"))
        .execute();

      res.json(adminUsers);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get details of an individual user by userId
userRouter.get(
  "/users/:userId",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      const user = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phone: users.phone,
          role: roles.name,
          walletId: wallets.walletId,
          apiKey: wallets.apiKey,
          identificationId: wallets.identificationId,
        })
        .from(users)
        .leftJoin(roles, eq(roles.id, users.roleId))
        .leftJoin(wallets, eq(wallets.userId, users.id))
        .where(eq(users.id, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get details of the authenticated user
userRouter.get(
  "/my-user-info",
  authenticate,
  authorize(["ADMIN"]),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    try {
      const user = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phone: users.phone,
          role: roles.name,
          walletId: wallets.walletId,
          apiKey: wallets.apiKey,
        })
        .from(users)
        .leftJoin(roles, eq(roles.id, users.roleId))
        .leftJoin(wallets, eq(wallets.userId, users.id))
        .where(eq(users.id, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update a user
userRouter.put(
  "/users/:id",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, email, phone, walletId, apiKey } = req.body;

    try {
      // Update user details
      await db
        .update(users)
        .set({
          ...(username && { username }),
          ...(email && { email }),
          ...(phone && { phone }),
        })
        .where(eq(users.id, Number(id)))
        .execute();

      // Update wallet details
      await db
        .update(wallets)
        .set({
          ...(walletId && { walletId }),
          ...(apiKey && { apiKey }),
        })
        .where(eq(wallets.userId, Number(id)))
        .execute();

      res.json({ message: "User and wallet updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update user pin
userRouter.put(
  "/users/:id/pin",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      res.status(400).json({ error: "Pin is required" });
      return;
    }

    try {
      const result = await db
        .update(users)
        .set({ pin })
        .where(eq(users.id, Number(id)))
        .execute();

      res.json({ message: "Pin updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update user password
userRouter.put(
  "/users/:id/password",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, Number(id)))
        .execute();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update the authenticated user's pin
userRouter.put(
  "/users/me/update-pin",
  authenticate, // Ensure only `authenticate` is used
  authorize(["ADMIN"]), // Ensure only `authorize` is used
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { pin } = req.body;

    if (!pin) {
      res.status(400).json({ error: "Pin is required" });
      return;
    }

    try {
      await db
        .update(users)
        .set({ pin })
        .where(eq(users.id, Number(userId)))
        .execute();

      res.json({ message: "Pin updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update the authenticated user's password
userRouter.put(
  "/users/me/update-password",
  authenticate, // Ensure only `authenticate` is used
  authorize(["ADMIN"]), // Ensure only `authorize` is used
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, Number(userId)))
        .execute();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete a user
userRouter.delete(
  "/users/:id",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, Number(id)))
        .execute();

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default userRouter;
