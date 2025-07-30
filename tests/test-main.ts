import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import type { FutureOptionMarket } from "../target/types/future_option_market";
import { type ConfigT, getConfigAcct, ll, zero } from "./utils.ts";

let configAcct: ConfigT;
let keypair: Keypair;
let amount: number;
let tx: string;

describe("future-option-market Main Test", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace
		.FutureOptionMarket as Program<FutureOptionMarket>;
	const wallet = provider.wallet as anchor.Wallet;
	ll(`provider wallet: ${wallet.publicKey}`);

	const pgid = program.programId;
	const configPbk = getConfigAcct(pgid, "config");

	const adamKp = new Keypair();
	const adam = adamKp.publicKey;
	const bobKp = new Keypair();
	const bob = bobKp.publicKey;

	it("Is initialized!", async () => {
		const tx = await program.methods.initialize().rpc();
		ll("tx", tx);
		configAcct = await program.account.config.fetch(configPbk);
		//ll("configAcct:", JSON.stringify(configAcct));
		expect(configAcct.owner.equals(wallet.publicKey));
		expect(configAcct.balance.eq(zero));
		//assert.ok(counterAccount.count.eq(new anchor.BN(0)));
	});
});
//@types/mocha@10.0.10
//chai@5.2.1
