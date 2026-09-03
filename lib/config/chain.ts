// lib/config/chain.ts — verified against node_modules/@somnia-chain/markets-sdk/dist/chains/definitions/somniaShannon.js
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";

// Re-export canonical chain + addresses — never hardcode
export { somniaShannon, SOMNIA_TESTNET_ADDRESSES };
export const SHANNON_CHAIN_ID = 50312 as const;
export const COLLATERAL_ADDRESS = SOMNIA_TESTNET_ADDRESSES.collateral as `0x${string}`;
export const EXPLORER_TX = (hash: string) => `https://shannon-explorer.somnia.network/tx/${hash}`;
export const EXPLORER_ADDRESS = (addr: string) => `https://shannon-explorer.somnia.network/address/${addr}`;
