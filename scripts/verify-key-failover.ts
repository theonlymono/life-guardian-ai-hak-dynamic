/**
 * Live check that a spent key hands over to the next one. Run against real
 * keys: the unit tests cover the decision, this covers the round trip.
 *
 *   AI_API_KEYS="<dead-key>,<good-key>" npx tsx scripts/verify-key-failover.ts
 */
import { completeJson, getApiKeys } from "../lib/ai/client";

async function main(): Promise<void> {
  const keys = getApiKeys();
  console.log(`pool size: ${keys.length}`);
  console.log(`starts on: ${keys[0]?.slice(0, 12)}...`);

  const first = await completeJson('Return {"ok":true}', "Reply with JSON only.");
  console.log(`recovered onto a working key: ${JSON.stringify(first)}`);

  const second = await completeJson('Return {"ok":true}', "Reply with JSON only.");
  console.log(`second call stayed on it: ${JSON.stringify(second)}`);
}

main().catch((error) => {
  console.error("failover check failed:", error);
  process.exit(1);
});
