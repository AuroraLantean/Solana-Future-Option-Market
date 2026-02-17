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
	type ConfigT,
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
let mint: PublicKey;
let pricefeedPair: PriceFeed;
let config: ConfigT;
let simpleAcct: SimpleAcctT;

import type { FutureOptionMarket } from "../target/types/future_option_market.ts";

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
	keypair = adminKp;
	initConfig(keypair, configPbk);

	//TODO: decoder for ConfigPbk
	// expect(config.owner.equals(admin));
	// expect(config.admin.equals(admin));
	// expect(config.balance.eq(zero));
});
test("SimpleAccount", async () => {
	ll("\n------== SimpleAccount");
	const price = 1900n;
	initSimpleAcct(adminKp, simpleAcctPbk, price);
});
