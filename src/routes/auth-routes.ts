import express from "express";
import { authenticate } from "../middleware/auth";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { users, roles } from "../db/schema";
import { db } from "../db"; // Assuming you have a database connection file
import { eq } from "drizzle-orm"; // Ensure this is imported correctly

const authRouter = express.Router();

// login
// This route is for users to log in
authRouter.post(
  "/login",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { phone, password } = req.body;

    try {
      // Fetch user by phone number along with their role
      const usersResult = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          role: roles.name,
        })
        .from(users)
        .leftJoin(roles, eq(roles.id, users.roleId)) // Fix: Use eq correctly
        .where(eq(users.phone, phone)) // Fix: Use eq correctly
        .execute();

      const user = usersResult[0]; // Get the first result

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check if the user has the SUPER_ADMIN role
      if (user.role !== "ADMIN") {
        res
          .status(403)
          .json({ error: "Access denied. Only ADMIN can log in here." });
        return;
      }

      // Compare password with hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1m" }
      );

      const refreshToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: "1h" }
      );

      res.json({ access_token: accessToken, refresh_token: refreshToken });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// admin-login
// This route is for SUPER_ADMIN to log in
authRouter.post(
  "/admin-login",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { phone, password } = req.body;

    try {
      // Fetch user by phone number along with their role
      const usersResult = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          role: roles.name,
        })
        .from(users)
        .leftJoin(roles, eq(roles.id, users.roleId)) // Fix: Use eq correctly
        .where(eq(users.phone, phone)) // Fix: Use eq correctly
        .execute();

      const user = usersResult[0]; // Get the first result

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check if the user has the SUPER_ADMIN role
      if (user.role !== "SUPER_ADMIN") {
        res
          .status(403)
          .json({ error: "Access denied. Only SUPER_ADMIN can log in here." });
        return;
      }

      // Compare password with hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1m" }
      );

      const refreshToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: "1h" }
      );

      res.json({ access_token: accessToken, refresh_token: refreshToken });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// refresh-token
// This route is used to refresh the access token using the refresh token
authRouter.post(
  "/refresh-token",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    try {
      const payload = jwt.verify(
        refresh_token,
        process.env.JWT_REFRESH_SECRET as string
      ) as jwt.JwtPayload;

      // Generate new tokens
      const newAccessToken = jwt.sign(
        { id: payload.id, username: payload.username, role: payload.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1m" }
      );

      const newRefreshToken = jwt.sign(
        { id: payload.id, username: payload.username, role: payload.role },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: "1h" }
      );

      res.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      });
    } catch (error) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  }
);

// test-token
authRouter.get(
  "/test-token",
  authenticate,
  async (req: express.Request, res: express.Response): Promise<void> => {
    res.status(200).json({
      message: "Token is valid",
      user: req.user,
    });
  }
);

export default authRouter;
