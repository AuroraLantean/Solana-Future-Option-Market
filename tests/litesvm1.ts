import { expect, test } from "bun:test";
import {
	type Keypair,
	type PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import jsonPricefeedBTCUSD from "../pricefeedsPyth/BTCUSD.json";
import {
	initSolBalc,
	pythOracle,
	setPriceFeedPda,
	svm,
} from "./litesvm-utils.ts";
import { ll } from "./utils.ts";
import {
	addrPricefeedBTCUSD,
	hackerKp,
	user1,
	user1Kp,
} from "./web3jsSetup.ts";

//clear; jj tts 1
let signerKp: Keypair;
let pricefeedAcct: PublicKey;

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
	signerKp = user1Kp;
	pricefeedAcct = addrPricefeedBTCUSD;

	setPriceFeedPda(pricefeedAcct, jsonPricefeedBTCUSD);
	pythOracle(signerKp, pricefeedAcct);

	// const pdaRaw = svm.getAccount(configPDA);
	// expect(pdaRaw).not.toBeNull();
	// const rawAccountData = pdaRaw?.data;
	// ll("rawAccountData:", rawAccountData);
	// expect(pdaRaw?.owner).toEqual(addrFutureOption);

	//const decoded = solanaKitDecodeConfigDev(rawAccountData);
});
