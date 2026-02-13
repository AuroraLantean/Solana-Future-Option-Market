import { Keypair, PublicKey } from "@solana/web3.js";
import jsonPythBTC from "../pricefeeds/pythBTC.json";
import jsonPythETH from "../pricefeeds/pythETH.json";
import jsonPythSOL from "../pricefeeds/pythSOL.json";
import type { SolanaAccount } from "./utils";

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

export const addrFutureOption = new PublicKey(
	"CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp",
);
ll("addrFutureOption:", addrFutureOption.toBase58());
export const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111"); //default

//-------------== PriceFeed
export type PriceFeed = {
	vendor: number;
	feedId: string;
	addr: PublicKey;
	json: SolanaAccount;
};
//https://docs.pyth.network/price-feeds/core/price-feeds/price-feed-ids
export const pythPricefeedBTCUSD: PriceFeed = {
	vendor: 0,
	feedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
	addr: new PublicKey("4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo"),
	json: jsonPythBTC,
};
export const pythPricefeedETHUSD: PriceFeed = {
	vendor: 0,
	feedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
	addr: new PublicKey("42amVS4KgzR9rA28tkVYqVXjq9Qa8dcZQMbH5EYFX6XC"),
	json: jsonPythETH,
};
export const pythPricefeedSOLUSD: PriceFeed = {
	vendor: 0,
	feedId: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
	addr: new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
	json: jsonPythSOL,
};
