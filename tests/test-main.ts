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
	PublicKey,
	SystemProgram,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import { expect } from "chai";
import { LiteSVM } from "litesvm";
import type { FutureOptionMarket } from "../target/types/future_option_market";
import {
	bigSol,
	bn,
	type ConfigT,
	getConfigAcct,
	ll,
	llbl,
	unixToLocal,
	zero,
} from "./utils.ts";

let configAcct: ConfigT;
let keypair: Keypair;
let amount: number;
let tx: string;
let to: PublicKey;

describe("Future Option Main Test", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace
		.FutureOptionMarket as Program<FutureOptionMarket>;
	const wallet = provider.wallet as anchor.Wallet;
	const walletPk = wallet.publicKey;
	const pgid = program.programId;
	const configPbk = getConfigAcct(pgid, "config");

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

	const receiver = PublicKey.unique();
	const blockhash = svm.latestBlockhash();
	const balanceAfter = svm.getBalance(receiver);
	//expect(balanceAfter).toBe(transferLamports);

	it("Is initialized!", async () => {
		const tx = await program.methods.initialize().rpc();
		ll("tx", tx);
		configAcct = await program.account.config.fetch(configPbk);
		//ll("configAcct:", JSON.stringify(configAcct));
		expect(configAcct.owner.equals(walletPk));
		expect(configAcct.balance.eq(zero));
		//assert.ok(counterAccount.count.eq(new anchor.BN(0)));
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
		configAcct = await program.account.config.fetch(configPbk);
		ll("in Sol:", unixToLocal(configAcct.time));

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
		configAcct = await program.account.config.fetch(configPbk);
		ll("in Sol:", unixToLocal(configAcct.time));
	});
});
