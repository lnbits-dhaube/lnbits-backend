import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import { db } from "../db";
import { wallets } from "../db/schema";
import { eq } from "drizzle-orm";
import { getPaymentList } from "../utils/get-payment-list";
import { getPaymentHistory } from "../utils/get-payment-history";
import { satsToUsd } from "../utils/stats-to-usd";

const paymentRoutes = express.Router();

// wallet/:userId
// This route is for SUPER_ADMIN to get wallet balance of any user
paymentRoutes.get(
  "/wallet/:userId",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const wallet = await db
        .select({
          apiKey: wallets.apiKey,
          walletId: wallets.walletId,
        })
        .from(wallets)
        .where(eq(wallets.userId, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!wallet) {
        res.status(404).json({ error: "Wallet not found for the user" });
        return;
      }

      const response = await fetch(`${process.env.BASE_API_URL}/wallet`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": wallet.apiKey, // Use environment variable
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Wallet error:", data.detail);
        res
          .status(response.status)
          .json({ error: data.detail || "Failed to fetch wallet" });
        return;
      }
      const balance_msats = data.balance;
      const balance_sats = balance_msats / 1000;
      const balance_usd = await satsToUsd(balance_sats);
      const balance_btc = balance_sats / 100_000_000;

      res.json({
        balance: balance_usd.toFixed(3),
        btc_balance: balance_btc.toFixed(8),
      });
      return;
    } catch (error) {
      console.error("Wallet error:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }
);

// payment-history/:userId
// This route is for SUPER_ADMIN to get payment history of any user
paymentRoutes.get(
  "/payment-history/:userId",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async function (req: express.Request, res: express.Response): Promise<void> {
    const { userId } = req.params;

    try {
      // Fetch wallet details from the database
      const wallet = await db
        .select({
          apiKey: wallets.apiKey,
          walletId: wallets.walletId,
        })
        .from(wallets)
        .where(eq(wallets.userId, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!wallet) {
        res.status(404).json({ error: "Wallet not found for the user" });
        return;
      }

      // Reuse the logic from get-payment-history.ts
      await getPaymentHistory(wallet.apiKey, wallet.walletId, req, res);
    } catch (error) {
      console.error("Internal Server Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// my-payment-history
// This route is for ADMIN to get their own payment history
paymentRoutes.get(
  "/my-payment-history",
  authenticate,
  authorize(["ADMIN"]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    const userId = req.user?.id;

    try {
      // Fetch wallet details from the database
      const wallet = await db
        .select({
          apiKey: wallets.apiKey,
          walletId: wallets.walletId,
        })
        .from(wallets)
        .where(eq(wallets.userId, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!wallet) {
        res.status(404).json({ error: "Wallet not found for the user" });
        return;
      }

      // Reuse the logic from get-payment-history.ts
      await getPaymentHistory(wallet.apiKey, wallet.walletId, req, res);
    } catch (error) {
      console.error("Internal Server Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// payment-list/:userId
// This route is for SUPER_ADMIN to get payment list of any user
paymentRoutes.get(
  "/payment-list/:userId",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { userId } = req.params;

    try {
      // Fetch wallet details from the database
      const wallet = await db
        .select({
          apiKey: wallets.apiKey,
          walletId: wallets.walletId,
        })
        .from(wallets)
        .where(eq(wallets.userId, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!wallet) {
        res.status(404).json({ error: "Wallet not found for the user" });
        return;
      }

      // Reuse the logic from get-payment-list.ts
      await getPaymentList(wallet.apiKey, wallet.walletId, req, res);
    } catch (error) {
      console.error("Internal Server Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// my-payment-list
// This route is for ADMIN to get their own payment list
paymentRoutes.get(
  "/my-payment-list",
  authenticate,
  authorize(["ADMIN"]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    const userId = req.user?.id;

    try {
      // Fetch wallet details from the database
      const wallet = await db
        .select({
          apiKey: wallets.apiKey,
          walletId: wallets.walletId,
        })
        .from(wallets)
        .where(eq(wallets.userId, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!wallet) {
        res.status(404).json({ error: "Wallet not found for the user" });
        return;
      }

      // Reuse the logic from get-payment-list.ts
      await getPaymentList(wallet.apiKey, wallet.walletId, req, res);
    } catch (error) {
      console.error("Internal Server Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// my-wallet
// This route is for ADMIN to get their own wallet balance
paymentRoutes.get(
  "/my-wallet",
  authenticate,
  authorize(["ADMIN"]),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const wallet = await db
        .select({
          apiKey: wallets.apiKey,
          walletId: wallets.walletId,
        })
        .from(wallets)
        .where(eq(wallets.userId, Number(userId)))
        .execute()
        .then((result) => result[0]);

      if (!wallet) {
        res.status(404).json({ error: "Wallet not found for the user" });
        return;
      }

      const response = await fetch(`${process.env.BASE_API_URL}/wallet`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": wallet.apiKey,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Wallet error:", data.detail);
        res
          .status(response.status)
          .json({ error: data.detail || "Failed to fetch wallet" });
        return;
      }
      const balance_msats = data.balance;
      const balance_sats = balance_msats / 1000;
      const balance_usd = await satsToUsd(balance_sats);
      const balance_btc = balance_sats / 100_000_000;

      res.json({
        balance: balance_usd.toFixed(3),
        btc_balance: balance_btc.toFixed(8),
      });
      return;
    } catch (error) {
      console.error("Wallet error:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }
);

paymentRoutes.post(
  "/payment-request",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { amount, memo, unhashed_description, identificationId } = req.body;

      // Validate payload
      if (!amount || typeof amount !== "number" || amount <= 0) {
        res.status(400).json({ error: "Invalid or missing 'amount'" });
        return;
      }
      if (!memo || typeof memo !== "string") {
        res.status(400).json({ error: "Invalid or missing 'memo'" });
        return;
      }
      if (!unhashed_description || typeof unhashed_description !== "string") {
        res
          .status(400)
          .json({ error: "Invalid or missing 'unhashed_description'" });
        return;
      }
      if (!identificationId || typeof identificationId !== "string") {
        res
          .status(400)
          .json({ error: "Invalid or missing 'identificationId'" });
        return;
      }

      // Fetch wallet details using identificationId
      const wallet = await db
        .select({
          apiKey: wallets.apiKey,
        })
        .from(wallets)
        .where(eq(wallets.identificationId, identificationId))
        .execute()
        .then((result) => result[0]);

      if (!wallet) {
        res
          .status(404)
          .json({ error: "Wallet not found for the given identificationId" });
        return;
      }

      const apiKey = wallet.apiKey;
      const description = Buffer.from(unhashed_description, "utf-8").toString(
        "hex"
      );
      console.log("Payment request:", { amount, memo, description });

      const response = await fetch(`${process.env.BASE_API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          out: false,
          amount: amount,
          memo: memo,
          unit: "USD",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Payment request error:", data.detail);
        res
          .status(response.status)
          .json({ error: data.detail || "Error creating invoice" });
        return;
      }

      res.json({ payment_request: data.payment_request });
      return;
    } catch (error) {
      console.error("Payment request error:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }
);

export default paymentRoutes;
