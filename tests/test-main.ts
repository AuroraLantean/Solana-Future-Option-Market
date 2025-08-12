import * as anchor from "@coral-xyz/anchor";
import { Keypair, type PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
//import { type AccountInfoBytes, LiteSVM } from "litesvm";
//import type { FutureOptionMarket } from "../target/types/future_option_market";
import {
	type AdminPdaT,
	addSol,
	balcSOL,
	balcToken,
	bn,
	bnTok,
	type ConfigT,
	getAdminPda,
	getAdminPdaata,
	getConfig,
	getOptCtrt,
	getUserPayment,
	ll,
	mintAuthKp,
	mintToken,
	newMint,
	type OptCtrtT,
	type TokenBalc,
	time,
	tokenProg,
	type UserPaymentT,
	usdtDecimals,
	week,
	zero,
} from "./utils.ts";

let config: ConfigT;
let optCtrt: OptCtrtT;
let adminPda: AdminPdaT;
let user1Payment: UserPaymentT;
let keypair: Keypair;
let amount: number;
let amtInBig: bigint;
let amtOutBig: bigint;
let timeLocal: number;
let t0: number;
let amtBn: anchor.BN;
let strike: anchor.BN;
let ctrtPrice: anchor.BN;
let expiry: number;
let strikePrices: anchor.BN[];
let ctrtPrices: anchor.BN[];
let expiryTimes: number[];
let tx: string;
let optionId: string;
let assetName: string;
let isCallOpt: boolean;
let optCtrtPbk: PublicKey;
let toAta: PublicKey;
let adminPdaPbk: PublicKey;
let adminPdaAtaPbk: PublicKey;
let user1PaymentPbk: PublicKey;
let adminAta: PublicKey;
let user1Ata: PublicKey;
let usdtMint: PublicKey;
let balcAdminPdaAtaAf: TokenBalc | null;
let user1AtaBalc: TokenBalc | null;
let signerAtaBalc: TokenBalc | null;

describe("Future Option Main Test", () => {
	const provider = anchor.AnchorProvider.env();
	const conn = provider.connection;
	anchor.setProvider(provider);

	const program = anchor.workspace.FutureOptionMarket; // as Program<FutureOptionMarket>
	const wat = provider.wallet as anchor.Wallet;
	const wallet = wat.publicKey;
	const pgid = program.programId;
	const configPbk = getConfig(pgid, "config");

	const payerKp = mintAuthKp; // new Keypair();
	const payer = payerKp.publicKey;
	const adminKp = new Keypair();
	const admin = adminKp.publicKey;
	const uniqueKp = new Keypair();
	const unique = uniqueKp.publicKey;
	const user1Kp = new Keypair();
	const user1 = user1Kp.publicKey;
	const user2Kp = new Keypair();
	const user2 = user2Kp.publicKey;

	before(async () => {
		await balcSOL(conn, wallet, "wallet");
		await addSol(conn, payer, "payer", 10);
		await addSol(conn, admin, "admin", 10);
		await addSol(conn, user1, "user1", 10);
		await addSol(conn, user2, "user2", 10);
	});

	it("init Mint", async () => {
		usdtMint = await newMint(conn, payerKp, usdtDecimals, "usdtMint");
	});

	it("init Config", async () => {
		keypair = adminKp;
		tx = await program.methods
			.initConfig([unique, tokenProg])
			.accounts({
				mint: usdtMint,
				//config: configPbk,
				signer: admin, // keypair.publicKey,
			})
			.signers([keypair])
			.rpc();
		ll("config init tx", tx);
		config = await program.account.config.fetch(configPbk);
		//ll("config:", JSON.stringify(config));
		expect(config.owner.equals(wallet));
		expect(config.balance.eq(zero));
	});

	it("Owner: New Call Option", async () => {
		optionId = "owner-0";
		assetName = "Bitcoin";
		isCallOpt = true;
		strikePrices = [
			bn(115000),
			bn(116000),
			bn(117000),
			bn(118000),
			bn(119000),
			bn(120000),
			bn(121000),
		];
		ctrtPrices = [bn(94), bn(95), bn(96), bn(97), bn(98), bn(99), bn(100)];
		t0 = time();
		ll("t0:", t0);
		expiryTimes = [
			t0 + week,
			t0 + week * 2,
			t0 + week * 3,
			t0 + week * 4,
			t0 + week * 5,
			t0 + week * 6,
			t0 + week * 7,
		];
		ll("about to call newOption()");
		keypair = adminKp;
		await program.methods
			.newOption(
				optionId,
				assetName,
				isCallOpt,
				strikePrices,
				ctrtPrices,
				expiryTimes,
			)
			.accounts({
				//config: configPbk,
				signer: admin,
			})
			.signers([keypair])
			.rpc();
		ll("check 010");
		optCtrtPbk = getOptCtrt(optionId, unique, pgid, "option");
		optCtrt = await program.account.optContract.fetch(optCtrtPbk);
		ll("check23 optCtrt:", JSON.stringify(optCtrt));
		ll(optCtrt.strikePrices[0]?.toNumber());
		ll(optCtrt.ctrtPrices[0]?.toNumber());
		assert(assetName === optCtrt.assetName);
		assert(isCallOpt === optCtrt.isCall);
		assert(expiryTimes[0] === optCtrt.expiryTimes[0]);
		assert(optCtrt.strikePrices[0]!.eq(strikePrices[0]!));
		assert(optCtrt.ctrtPrices[0]!.eq(ctrtPrices[0]!));
	});

	it("User1 init UserPayment", async () => {
		keypair = user1Kp;
		tx = await program.methods
			.initUserPayment()
			.accounts({
				optCtrt: optCtrtPbk,
				//config: configPbk,
				user: keypair.publicKey,
			})
			.signers([keypair])
			.rpc();
		ll("config init tx", tx);

		user1PaymentPbk = getUserPayment(
			keypair.publicKey,
			optCtrtPbk,
			pgid,
			"userPayment",
		);
		user1Payment = await program.account.userPayment.fetch(user1PaymentPbk);
		ll("user1Payment:", JSON.stringify(user1Payment));
		//expect(user1Payment.payments.eq(zero));
	});

	it("init Admin PDA", async () => {
		keypair = adminKp;
		await program.methods
			.initAdminPda()
			.accounts({ admin: admin })
			.signers([keypair])
			.rpc();
		ll("initAdminPda successful");

		adminPdaPbk = getAdminPda(pgid, "admin pda");
		adminPda = await program.account.adminPda.fetch(adminPdaPbk);
		ll("authPda:", JSON.stringify(adminPda));
		expect(adminPda.solBalc.eq(zero));
	});

	it("init Admin PDA ATA", async () => {
		keypair = adminKp;
		await program.methods
			.initAdminPdaAta()
			.accounts({
				//adminPda,
				mint: usdtMint,
				admin: admin,
				//config,
				tokenProgram: tokenProg,
			})
			.signers([keypair])
			.rpc();
		ll("initTokenPdaAta successful");

		adminPdaAtaPbk = getAdminPdaata(pgid, "adminPdaAta");
		balcAdminPdaAtaAf = await balcToken(conn, adminPdaAtaPbk, "tokenPdaAta");
	});

	it("Init Ata and Mint tokens", async () => {
		adminAta = await mintToken(conn, 9000, admin, usdtMint, "USDT Admin");
		user1Ata = await mintToken(conn, 9000, user1, usdtMint, "USDT User1");
	});
	it("User1 buys Option Contract", async () => {
		keypair = user1Kp;
		amtBn = bnTok(100, usdtDecimals);
		await program.methods
			.buyOption(optionId, amtBn)
			.accounts({
				//optCtrt: optCtrtPbk,
				//config: configPbk,
				userAta: user1Ata,
				//adminPdaAta: adminPdaAtaPbk,
				//userPayment: user1PaymentPbk,
				user: keypair.publicKey,
				mint: usdtMint,
				tokenProgram: tokenProg,
			})
			.signers([keypair])
			.rpc();

		user1PaymentPbk = getUserPayment(
			keypair.publicKey,
			optCtrtPbk,
			pgid,
			"userPayment",
		);
		user1Payment = await program.account.userPayment.fetch(user1PaymentPbk);
		ll(
			"user1Payment:",
			JSON.stringify(user1Payment),
			user1Payment.payments.toString(),
		);
		expect(user1Payment.payments[0]!.eq(amtBn));
		//expect(user1Payment.balance.eq(zero));

		user1AtaBalc = await balcToken(conn, user1Ata, "user1AtaBalc");
		balcAdminPdaAtaAf = await balcToken(conn, adminPdaAtaPbk, "balcTokPdaAta");
	});

	it("withdraw tokens", async () => {
		//admin to withdraw tokens
		keypair = adminKp;
		toAta = adminAta;
		amount = 70;
		amtBn = bnTok(amount, usdtDecimals);
		tx = await program.methods
			.withdrawToken(amtBn)
			.accounts({
				//config: configPbk,
				adminPda: adminPdaPbk,
				adminPdaAta: adminPdaAtaPbk,
				toAta,
				signer: keypair.publicKey,
				mint: usdtMint,
				tokenProgram: tokenProg,
			})
			.signers([keypair])
			.rpc();
		ll(JSON.stringify(tx));
		balcAdminPdaAtaAf = await balcToken(conn, adminPdaAtaPbk, "balcTokPdaAta");
		signerAtaBalc = await balcToken(conn, toAta, "adminAta");

		//user1 to withdraw the rest
		keypair = user1Kp;
		toAta = user1Ata;
		amount = 30;
		amtBn = bnTok(amount, usdtDecimals);
		tx = await program.methods
			.withdrawToken(amtBn)
			.accounts({
				//config: configPbk,
				adminPda: adminPdaPbk,
				adminPdaAta: adminPdaAtaPbk,
				toAta,
				signer: keypair.publicKey,
				mint: usdtMint,
				tokenProgram: tokenProg,
			})
			.signers([keypair])
			.rpc();
		ll(JSON.stringify(tx));
		balcAdminPdaAtaAf = await balcToken(conn, adminPdaAtaPbk, "balcTokPdaAta");
		signerAtaBalc = await balcToken(conn, toAta, "user1Ata");
	});

	/*it("time travel", async () => {
		const clock = svm.getClock();
		ll("pre travel clock:", clock.slot, clock.unixTimestamp);

		tx = await program.methods
			.timeTravel()
			.accounts({
				from: wallet,
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

		keypair = user1Kp;
		amount = 100;
		tx = await program.methods
			.timeTravel()
			.accounts({
				from: wallet,
			})
			.rpc();
		config = await program.account.config.fetch(configPbk);
		ll("in Sol:", unixToLocal(config.time));
	});*/
});
