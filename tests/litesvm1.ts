import { expect, test } from "bun:test";
import * as anchor from "@coral-xyz/anchor";
import {
	type Keypair,
	type PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	initConfig,
	initSimpleAcct,
	initSolBalc,
	pythOracle,
	setPriceFeedPda,
	svm,
} from "./litesvm-utils.ts";
import {
	getConfig,
	getSimpleAcct,
	ll,
	type SimpleAcctT,
	tokenProg,
	usdtMint,
	zero,
} from "./utils.ts";
import {
	admin,
	adminKp,
	hackerKp,
	type PriceFeed,
	pythPricefeedBTCUSD,
	pythPricefeedETHUSD,
	pythPricefeedSOLUSD,
	user1,
	user1Kp,
} from "./web3jsSetup.ts";

//clear; jj tts 1
let keypair: Keypair;
let signerKp: Keypair;
let pubkey: PublicKey;
let mint: PublicKey;
let pricefeedPair: PriceFeed;
let newU64: bigint;

import type { FutureOptionMarket } from "../target/types/future_option_market.ts";
import { solanaKitDecodeConfigDev } from "./decoder.ts";

ll("in litesvm1.ts");
//const provider = anchor.AnchorProvider.env();
//anchor.setProvider(provider);
const program = anchor.workspace
	.futureOptionMarket as anchor.Program<FutureOptionMarket>;
//const wat = provider.wallet as anchor.Wallet;
//const wallet = wat.publicKey;
//ll("wallet:", wallet.toBase58());

const pgid = program.programId;

const configPbk = getConfig(pgid);
const simpleAcctPbk = getSimpleAcct(pgid);

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
test("init Config", async () => {
	ll("\n------== init Config");
	keypair = adminKp;
	pubkey = keypair.publicKey;
	newU64 = 123n;
	ll("signer:", keypair.publicKey.toBase58());
	initConfig(keypair, configPbk, newU64);

	const pdaRaw = svm.getAccount(configPbk);
	expect(pdaRaw).not.toBeNull();
	const rawAccountData = pdaRaw?.data;
	ll("rawAccountData:", rawAccountData);
	expect(pdaRaw?.owner).toEqual(pgid);

	const decoded = solanaKitDecodeConfigDev(rawAccountData);
	expect(decoded.unique).toEqual(pubkey!);
	expect(decoded.progOwner.equals(pubkey));
	expect(decoded.admin.equals(pubkey));
	expect(decoded.newU64).toEqual(newU64);
});
test("SimpleAccount", async () => {
	ll("\n------== SimpleAccount");
	const price = 1900n;
	initSimpleAcct(adminKp, simpleAcctPbk, price);
});
