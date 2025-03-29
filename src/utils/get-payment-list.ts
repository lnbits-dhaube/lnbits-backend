import { Request, Response } from "express";
import ITransaction from "../types/ITransaction";

export const getPaymentList = async (
  apiKey: string,
  walletId: string,
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const apiUrl = `${process.env.BASE_API_URL}/payments?wallet=${walletId}`;

    // Fetch data from external API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error fetching payments:", data.detail);
      res
        .status(response.status)
        .json({ error: data.detail || "Failed to fetch payments" });
      return;
    }

    const formattedTransactions = data
      .filter((tx: ITransaction) => tx.status === "success")
      .map((tx: ITransaction) => {
        const amountValue =
          tx.extra?.fiat_amount ?? tx.extra?.wallet_fiat_amount ?? 0;
        return {
          memo: tx.memo || "No Description",
          date: new Date(tx.time * 1000).toLocaleString(),
          amount: amountValue,
          color: amountValue > 0 ? "text-green-600" : "text-red-500",
        };
      });

    res.json(formattedTransactions);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
