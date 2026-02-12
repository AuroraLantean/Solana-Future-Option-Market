import { Keypair, PublicKey } from "@solana/web3.js";

const ll = console.log;
ll("\n------== web3jsSetup");
export const ownerKp = new Keypair();
export const adminKp = new Keypair();
export const user1Kp = new Keypair();
export const user2Kp = new Keypair();
export const user3Kp = new Keypair();
export const hackerKp = new Keypair();

export const owner = ownerKp.publicKey;
export const admin = adminKp.publicKey;
export const user1 = user1Kp.publicKey;
export const user2 = user2Kp.publicKey;
export const user3 = user3Kp.publicKey;
export const hacker = hackerKp.publicKey;

export const futureOptionAddr = new PublicKey(
	"CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp",
);
ll("futureOptionAddr:", futureOptionAddr.toBase58());
export const pricefeedBTCUSD = new PublicKey(
	"4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo",
);
ll("pricefeedBTCUSD:", pricefeedBTCUSD.toBase58());

export const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111"); //default
