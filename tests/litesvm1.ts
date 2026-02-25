import { expect, test } from "bun:test";
import * as anchor from "@coral-xyz/anchor";
import {
	type Keypair,
	type PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	flashloan,
	initConfig,
	initSimpleAcct,
	initSolBalc,
	pythOracle,
	setPriceFeedPda,
	svm,
} from "./litesvm-utils.ts";
import { getConfig, getSimpleAcct, ll } from "./utils.ts";
import {
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
let signerKp: Keypair;
let signer: PublicKey;
let pricefeed: PriceFeed;
let newU64: bigint;

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { FutureOptionMarket } from "../target/types/future_option_market.ts";
import {
	solanaKitDecodeConfigDev,
	solanaKitDecodeSimpleAcctDev,
} from "./decoder.ts";

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
	pricefeed = pythPricefeedBTCUSD;
	setPriceFeedPda(pricefeed);
	pythOracle(signerKp, pricefeed);

	pricefeed = pythPricefeedETHUSD;
	setPriceFeedPda(pricefeed);
	pythOracle(signerKp, pricefeed);

	pricefeed = pythPricefeedSOLUSD;
	setPriceFeedPda(pricefeed);
	pythOracle(signerKp, pricefeed);
});
test("init Config", async () => {
	ll("\n------== init Config");
	signerKp = adminKp;
	signer = signerKp.publicKey;
	newU64 = 123n;
	ll("signer:", signerKp.publicKey.toBase58());
	initConfig(signerKp, configPbk, newU64);

	const pdaRaw = svm.getAccount(configPbk);
	expect(pdaRaw).not.toBeNull();
	const rawAccountData = pdaRaw?.data;
	ll("rawAccountData:", rawAccountData);
	expect(pdaRaw?.owner).toEqual(pgid);

	const decoded = solanaKitDecodeConfigDev(rawAccountData);
	expect(decoded.unique).toEqual(signer);
	expect(decoded.progOwner).toEqual(signer);
	expect(decoded.admin).toEqual(signer);
	expect(decoded.newU64).toEqual(newU64);
});
test("SimpleAccount", async () => {
	ll("\n------== SimpleAccount");
	ll("simpleAcctPbk:", simpleAcctPbk.toBase58());
	signerKp = adminKp;
	const price = 73200n;
	initSimpleAcct(signerKp, simpleAcctPbk, price);

	const pdaRaw = svm.getAccount(simpleAcctPbk);
	expect(pdaRaw).not.toBeNull();
	const rawAccountData = pdaRaw?.data;
	ll("rawAccountData:", rawAccountData);
	expect(pdaRaw?.owner).toEqual(pgid);

	const decoded = solanaKitDecodeSimpleAcctDev(rawAccountData);
	expect(decoded.writeAuthority).toEqual(signerKp.publicKey);
	expect(decoded.price).toEqual(price);
});
test("Flashloan", async () => {
	ll("\n------== Flashloan");
	signerKp = user1Kp;
	signer = signerKp.publicKey;
	ll("signerKp:", signer.toBase58());
	const lenderPda = user1;
	const lenderAta = user1;
	const userAta = user1;
	const mint = usdcMint;
	const tokenProgram = TOKEN_PROGRAM_ID;
	const amount = 73200n;

	flashloan(
		signerKp,
		lenderPda,
		lenderAta,
		userAta,
		mint,
		configPbk,
		tokenProgram,
		amount,
	);
});
