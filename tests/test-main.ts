import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
	ACCOUNT_SIZE,
	AccountLayout,
	getAssociatedTokenAddressSync,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
	Keypair,
	LAMPORTS_PER_SOL,
	type PublicKey,
	SystemProgram,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import { assert, expect } from "chai";
import { LiteSVM } from "litesvm";
import type { FutureOptionMarket } from "../target/types/future_option_market";
import {
	bigSol,
	bn,
	type ConfigT,
	getConfig,
	getOptCtrt,
	ll,
	llbl,
	type OptCtrtT,
	time,
	unixToLocal,
	zero,
} from "./utils.ts";

let config: ConfigT;
let optCtrt: OptCtrtT;
let keypair: Keypair;
let amount: number;
let timeLocal: number;
let expiry: number;
let strike: anchor.BN;
let ctrtPrice: anchor.BN;
let tx: string;
let optionId: string;
let assetName: string;
let assetNameOut: string;
let isCallOpt: boolean;
let to: PublicKey;

describe("Future Option Main Test", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace
		.FutureOptionMarket as Program<FutureOptionMarket>;
	const wallet = provider.wallet as anchor.Wallet;
	const walletPk = wallet.publicKey;
	const pgid = program.programId;
	const configPbk = getConfig(pgid, "config");

	const adamKp = new Keypair();
	const adam = adamKp.publicKey;
	const bobKp = new Keypair();
	const bob = bobKp.publicKey;

	const svm = new LiteSVM();
	const sol = (pubk: PublicKey) => svm.getBalance(pubk);
	ll(`wallet: ${walletPk}, ${sol(walletPk)}`);
	svm.airdrop(adam, bigSol(1000));
	llbl(`Adam balance:	${sol(adam)}`);
	svm.airdrop(bob, bigSol(1000));
	llbl(`Bob balance:	${sol(bob)}`);

	//const receiver = PublicKey.unique();
	//const blockhash = svm.latestBlockhash();
	//expect(balanceAfter).toBe(transferLamports);

	it("init Config PDA", async () => {
		const tx = await program.methods.initialize().rpc();
		ll("tx", tx);
		config = await program.account.config.fetch(configPbk);
		//ll("config:", JSON.stringify(config));
		expect(config.owner.equals(walletPk));
		expect(config.balance.eq(zero));
		//assert.ok(counterAccount.count.eq(new anchor.BN(0)));
	});

	it("Owner: New Call Option", async () => {
		ll("check21");
		optionId = "owner-0";
		assetName = "Bitcoin";
		isCallOpt = true;
		strike = bn(120000);
		ctrtPrice = bn(1000000);
		timeLocal = time();
		expiry = timeLocal + 10;
		ll("timeLocal", timeLocal);

		await program.methods
			.newOption(optionId, assetName, isCallOpt, strike, ctrtPrice, expiry)
			.accounts({
				//signer: auth,
				//config: settingsPbk,
			})
			.rpc();
		const optCtrtPbk = getOptCtrt(optionId, walletPk, pgid, "option");
		optCtrt = await program.account.optContract.fetch(optCtrtPbk);
		ll("check23 optCtrt:", JSON.stringify(optCtrt));
		ll(optCtrt.strike, optCtrt.price);
		assert(assetName === optCtrt.assetName);
		assert(isCallOpt === optCtrt.isCall);
		assert(expiry === optCtrt.expiry);
		assert.ok(optCtrt.strike.eq(strike));
		assert.ok(optCtrt.price.eq(ctrtPrice));
	});

	it("time travel", async () => {
		const clock = svm.getClock();
		ll("pre travel clock:", clock.slot, clock.unixTimestamp);

		tx = await program.methods
			.timeTravel()
			.accounts({
				from: walletPk,
			})
			.rpc();
		config = await program.account.config.fetch(configPbk);
		ll("in Sol:", unixToLocal(config.time));

		clock.unixTimestamp = BigInt(1767225600);
		svm.setClock(clock);
		svm.warpToSlot(1000n);
		const clock1 = svm.getClock();
		ll("after travel clock1:", clock1.slot, clock1.unixTimestamp);
		ll("wanted time:", unixToLocal(Number(clock1.unixTimestamp.toString())));

		keypair = adamKp;
		amount = 100;
		tx = await program.methods
			.timeTravel()
			.accounts({
				from: walletPk,
			})
			.rpc();
		config = await program.account.config.fetch(configPbk);
		ll("in Sol:", unixToLocal(config.time));
	});
});
