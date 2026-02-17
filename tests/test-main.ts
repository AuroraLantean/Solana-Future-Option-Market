import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
//import { expect, test } from "bun:test";
//import { type AccountInfoBytes, LiteSVM } from "litesvm";
//import type { FutureOptionMarket } from "../target/types/future_option_market";
import {
	type ABN,
	type AdminPdaT,
	addSol,
	balcSOL,
	balcToken,
	bn,
	bnTok,
	getAdminPda,
	getAdminPdaata,
	getConfig,
	getOptCtrt,
	getPremium,
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
import type { ConfigAcctT } from "./web3jsSetup.ts";

let config: ConfigAcctT;
let optCtrt: OptCtrtT;
let adminPda: AdminPdaT;
let user1Payment: UserPaymentT;
let keypair: Keypair;
let amount: number;
let amtInBig: bigint;
let amtOutBig: bigint;
let timeLocal: number;
let optIndex: number;
let t0: number;
let amtBn: ABN;
let optCtrtAmtBn: ABN;
let strike: ABN;
let ctrtPrice: ABN;
let expiry: number;
let strikePrices: ABN[];
let ctrtPrices: ABN[];
let expiryTimes: number[];
let tx: string;
let optionId: string;
let assetName: string;
let isCallOpt: boolean;
let configPbk: PublicKey;
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

	configPbk = getConfig(pgid);

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
			.initConfig()
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
		expect(config.progOwner.equals(wallet));
		//expect(config.newU64.eq(zero));
	});

	it("Owner: New Call Option", async () => {
		optionId = "owner-0";
		assetName = "Bitcoin";
		isCallOpt = true;
		strikePrices = [
			bn(115),
			bn(116),
			bn(117),
			bn(118),
			bn(119),
			bn(120),
			bn(121),
		].map((v) => v.mul(bn(1000)));
		ctrtPrices = [bn(94), bn(95), bn(96), bn(97), bn(98), bn(99), bn(100)].map(
			(v) => v.mul(bn(10000)),
		);
		ll("ctrtPrices:", ctrtPrices.toString());
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
		optCtrtPbk = getOptCtrt(unique, optionId, pgid, "optCtrt");

		optCtrt = await program.account.optContract.fetch(optCtrtPbk);
		ll("check23 optCtrt:", JSON.stringify(optCtrt));
		ll("strikePrices:", optCtrt.strikePrices[0]?.toNumber());
		ll("ctrtPrices:", optCtrt.ctrtPrices[0]?.toNumber());
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
		optCtrtAmtBn = bn(1);
		optIndex = 0;
		//optCtrtPbk = getOptCtrt(unique, optionId, pgid, "optCtrt");
		ll("optCtrtPbk:", optCtrtPbk.toBase58());

		await program.methods
			.buyOption(optionId, optCtrtAmtBn, optIndex)
			.accounts({
				optCtrt: optCtrtPbk,
				//config: configPbk,
				userAta: user1Ata,
				//adminPdaAta: adminPdaAtaPbk,
				//userPayment: user1PaymentPbk,
				mint: usdtMint,
				user: keypair.publicKey,
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
		ll("user1Payment:", user1Payment.payments.toString());

		optCtrt = await program.account.optContract.fetch(optCtrtPbk);
		const ctrtPrice = optCtrt.ctrtPrices[optIndex];
		ll("optCtrt price at index:", ctrtPrice?.toString());
		const premium = getPremium(optCtrtAmtBn, ctrtPrice);
		ll("premium:", premium.toString());
		expect(user1Payment.payments[optIndex]?.eq(premium));
		//expect(user1Payment.balance.eq(zero));

		user1AtaBalc = await balcToken(conn, user1Ata, "user1Ata");
		balcAdminPdaAtaAf = await balcToken(conn, adminPdaAtaPbk, "adminPdaAta");
	});

	it("withdraw tokens", async () => {
		//admin to withdraw tokens
		keypair = adminKp;
		toAta = adminAta;
		amount = 70;
		amtBn = bnTok(amount, usdtDecimals);
		ll("amtBn:", amtBn.toString());

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
		//ll(JSON.stringify(tx));
		balcAdminPdaAtaAf = await balcToken(conn, adminPdaAtaPbk, "balcTokPdaAta");
		signerAtaBalc = await balcToken(conn, toAta, "adminAta");

		//user1 to withdraw the rest
		keypair = user1Kp;
		toAta = user1Ata;
		amount = 24;
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

	it("Pyth Oracle", async () => {
		keypair = adminKp;
		/*const pythSolanaReceiver = new PythSolanaReceiver({ conn, wallet });
		const SOL_PRICE_FEED_ID =
			"0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
		// There are up to 2^16 different accounts for any given price feed id.
		// The 0 value below is the shard id that indicates which of these accounts you would like to use.
		// However, you may choose to use a different shard to prevent Solana congestion on another app from affecting your app.
		const solUsdPriceFeedAccount: PublicKey =
			pythSolanaReceiver.getPriceFeedAccountAddress(0, SOL_PRICE_FEED_ID);

		const priceFeedAccount = solUsdPriceFeedAccount;
		ll("priceFeedAccount:", priceFeedAccount.toBase58());*/
		const priceUpdate = new PublicKey(
			"4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo",
		);

		tx = await program.methods
			.pythOracle()
			.accounts({
				signer: keypair.publicKey,
				priceUpdate,
				//systemProgram: anchor.web3.SystemProgram.programId,
				//clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
				//config: configPbk,
			})
			.signers([keypair])
			.rpc();
		//ll(JSON.stringify(tx));
	});
});
