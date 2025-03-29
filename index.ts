import express from "express";
import dotenv from "dotenv";
import userRoutes from "./src/routes/user-routes";
import rolesRoutes from "./src/routes/roles-routes";
import authRoutes from "./src/routes/auth-routes";
import cors from "cors"; // Import CORS
import paymentRoutes from "./src/routes/payment-routes";

dotenv.config;

// Ensure the following environment variables are set in your .env file:
// JWT_SECRET=<your_jwt_secret>
// JWT_REFRESH_SECRET=<your_refresh_jwt_secret>
// DATABASE_URL=<your_database_url>

const app = express();

// Add CORS middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", rolesRoutes);
app.use("/api", paymentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
