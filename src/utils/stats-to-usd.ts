export async function satsToUsd(sats: number) {
  const balance_btc = sats / 100_000_000;
  const btcPriceRes = await fetch("https://blockchain.info/ticker");
  const btcPriceData = await btcPriceRes.json();
  const btcPrice = btcPriceData.USD.last;
  const balance_usd = balance_btc * btcPrice;
  return balance_usd;
}
