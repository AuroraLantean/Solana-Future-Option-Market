import { expect, test } from "bun:test";
import { type Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
	initSolBalc,
	pythOracle,
	setPriceFeedPda,
	svm,
} from "./litesvm-utils.ts";
import { ll, type SolanaAccount } from "./utils.ts";
import {
	hackerKp,
	type PriceFeed,
	pythPricefeedBTCUSD,
	pythPricefeedETHUSD,
	pythPricefeedSOLUSD,
	user1,
	user1Kp,
} from "./web3jsSetup.ts";

//clear; jj tts 1
let signerKp: Keypair;
let pricefeedPair: PriceFeed;
let json: SolanaAccount;

test("one transfer", () => {
	const payer = hackerKp;
	const receiver = user1;
	const blockhash = svm.latestBlockhash();
	const amt = 1_000_000n;
	const ixs = [
		SystemProgram.transfer({
			fromPubkey: payer.publicKey,
			toPubkey: receiver,
			lamports: amt,
		}),
	];
	const tx = new Transaction();
	tx.recentBlockhash = blockhash;
	tx.add(...ixs);
	tx.sign(payer);
	svm.sendTransaction(tx);

	const balanceAfter = svm.getBalance(receiver);
	expect(balanceAfter).toBe(amt + initSolBalc);
});

test("PythOracle", () => {
	ll("\n------== PythOracle");
	ll(
		"make sure you pull pricefeed account data first into the 'pricefeeds' folder",
		"and those account data files should be named as pythBTC.json, pythETH.json, pythSOL.json according to web3jsSetup.ts",
	);
	signerKp = user1Kp;
	pricefeedPair = pythPricefeedBTCUSD;
	setPriceFeedPda(pricefeedPair);
	pythOracle(signerKp, pricefeedPair);

	pricefeedPair = pythPricefeedETHUSD;
	setPriceFeedPda(pricefeedPair);
	pythOracle(signerKp, pricefeedPair);

	pricefeedPair = pythPricefeedSOLUSD;
	setPriceFeedPda(pricefeedPair);
	pythOracle(signerKp, pricefeedPair);
});
