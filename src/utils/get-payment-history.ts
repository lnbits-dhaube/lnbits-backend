import { Request, Response } from "express";
import IPaymentHistory from "../types/IPaymentHistory";

export const getPaymentHistory = async (
  apiKey: string,
  walletId: string,
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const group = req.query.group;

    const apiUrl = `${
      process.env.BASE_API_URL
    }/payments/history?wallet=${walletId}${
      group && group !== "week" ? `&group=${group}` : ""
    }`;

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

    let history;
    if (group === "day") {
      const today = new Date();
      history = data.filter((tx: IPaymentHistory) => {
        return new Date(tx.date).getDate() === today.getDate();
      });
    } else if (group === "week") {
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);

      let totalIncome = 0;
      let totalSpending = 0;
      let totalBalance = 0;

      data.forEach((tx: IPaymentHistory) => {
        const txDate = new Date(tx.date);
        if (txDate >= oneWeekAgo && txDate <= today) {
          totalIncome += tx.income;
          totalSpending += tx.spending;
          totalBalance = tx.balance;
        }
      });

      history = {
        date: `${oneWeekAgo.toISOString().split("T")[0]} to ${
          today.toISOString().split("T")[0]
        }`,
        income: totalIncome,
        spending: totalSpending,
        balance: totalBalance,
      };
    } else if (group === "month") {
      const today = new Date();
      history = data.filter((tx: IPaymentHistory) => {
        return new Date(tx.date).getMonth() === today.getMonth();
      });
    } else {
      history = data;
    }

    res.json(history);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
