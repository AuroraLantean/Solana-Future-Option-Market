import type * as anchor from "@coral-xyz/anchor";
import {
	ACCOUNT_SIZE,
	AccountLayout,
	createMint,
	getAssociatedTokenAddressSync,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import chalk from "chalk";
import type { LiteSVM } from "litesvm";

//------------== Project config
export const tokenProg = TOKEN_PROGRAM_ID; // USDT, USDC
export const usdtDecimals = 6; // USDT
export const usdcDecimals = 6; // USDC

//------------== Only for Testings
//this section should be removed from the frontend
export const mintAuthKp = new Keypair();
export const mintAuth = mintAuthKp.publicKey;
//cannot generate payer here, then import it into tests...

//------------==
export const ll = console.log;
export type ABN = anchor.BN;
export const bn = (num: number | string) => new BN(num);
export const zero = bn(0);
export const ten = bn(10);
export const day = 86400;
export const week = 604800;

//export const big = (n: BigNumber.Value) => new BigNumber(n);
//export const big0 = big(0);
//For frontend, Not for Anchor tests!
export const usdtMint = new PublicKey(
	"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
); //usdc EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

//----------------==
export const bigSol = (amt: number) => BigInt(LAMPORTS_PER_SOL * amt);
export const bnTok = (uiAmount: number, decimals: number) =>
	ten.pow(bn(decimals)).mul(bn(uiAmount));

export type ConfigT = {
	owner: PublicKey;
	balance: ABN;
	time: number;
};
export type OptCtrtT = {
	assetName: string;
	isCall: boolean;
	strikePrices: ABN[]; //strike_price
	ctrtPrices: ABN[];
	expiryTimes: number[];
};
export type UserPaymentT = {
	payments: ABN[];
};
export type AdminPdaT = {
	solBalc: ABN;
};

export const getConfig = (programId: PublicKey, pdaName: string): PublicKey => {
	const [publickey, bump] = PublicKey.findProgramAddressSync(
		[Buffer.from("future_option_config")],
		programId,
	);
	ll(pdaName, ":", publickey.toBase58());
	return publickey;
};
export const getOptCtrt = (
	config_uniquekey: PublicKey,
	optionId: string,
	programId: PublicKey,
	pdaName: string,
): PublicKey => {
	const [publickey, bump] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("future_option_contract"),
			config_uniquekey.toBuffer(),
			Buffer.from(optionId),
		],
		programId,
	);
	ll(pdaName, ":", publickey.toBase58());
	return publickey;
};
export const getAdminPda = (programId: PublicKey, pdaName: string) => {
	const [pubkey, bump] = PublicKey.findProgramAddressSync(
		[Buffer.from("future_option_adminpda")],
		programId,
	);
	ll(pdaName, ":", pubkey.toBase58());
	return pubkey;
};
export const getAdminPdaata = (
	programId: PublicKey,
	pdaName: string,
): PublicKey => {
	const [publickey, bump] = PublicKey.findProgramAddressSync(
		[Buffer.from("future_option_adminpdaata")],
		programId,
	);
	ll(pdaName, ":", publickey.toBase58());
	return publickey;
};
export const getUserPayment = (
	user: PublicKey,
	opt_ctrt: PublicKey,
	programId: PublicKey,
	pdaName: string,
): PublicKey => {
	const [publickey, bump] = PublicKey.findProgramAddressSync(
		[
			Buffer.from("future_option_user_payment"),
			user.toBuffer(),
			opt_ctrt.toBuffer(),
		],
		programId,
	);
	ll(pdaName, ":", publickey.toBase58());
	return publickey;
};
export const getPremium = (optCtrtAmtBn: ABN, ctrtPrice: ABN | undefined) => {
	if (!ctrtPrice) throw new Error("ctrtPrice is null");
	return optCtrtAmtBn.mul(bn(100)).mul(ctrtPrice);
}; // option contract premium = 100 shares of the underlying asset price

export const addSol = async (
	conn: anchor.web3.Connection,
	target: PublicKey,
	toName: string,
	amountInSOL = 10,
) => {
	ll("airDropSol()...");
	try {
		const airdropSig = await conn.requestAirdrop(
			target,
			amountInSOL * LAMPORTS_PER_SOL,
		);
		const latestBlockHash = await conn.getLatestBlockhash();

		await conn.confirmTransaction({
			blockhash: latestBlockHash.blockhash,
			lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
			signature: airdropSig,
		});
		await balcSOL(conn, target, toName);
	} catch (error) {
		console.error("airdrop on SOL failed:", error);
	}
};
export const balcSOL = async (
	conn: anchor.web3.Connection,
	target: PublicKey,
	targetName = "unknown",
) => {
	const lamports = await conn.getBalance(target);
	ll(
		`${targetName} ${target.toBase58()} SOL balc: ${lamports / LAMPORTS_PER_SOL}`,
	);
};
export type TokenBalc = {
	str: string;
	bn: ABN;
	num: number;
};
export const balcToken = async (
	conn: anchor.web3.Connection,
	tokenAccount: PublicKey,
	targetName = "unknown",
	tokenName = "tokenX",
): Promise<TokenBalc | null> => {
	const acct = await conn.getTokenAccountBalance(tokenAccount);
	if (acct.value.uiAmount === null) return null;
	const value = acct.value;
	ll(
		`${targetName} token balc: ${value.amount} with decimals: ${value.decimals}, uiAmount: ${value.uiAmount} in ${tokenName}`,
	); //value.uiAmountString
	return {
		str: value.amount,
		bn: bn(value.amount),
		num: value.uiAmount ?? 0,
	};
};
export const newMint = async (
	conn: anchor.web3.Connection,
	payerKp: Keypair,
	//mintAuthority: PublicKey,
	decimals: number,
	mintName = "unknown",
) => {
	ll("newMint()");
	const mint = await createMint(
		conn,
		//mintAuthKp,
		payerKp,
		mintAuth,
		//mintAuthority,
		null, //freezeAuthority
		decimals,
		undefined,
		undefined,
		tokenProg,
	);
	ll(mintName, ":", mint.toBase58());
	return mint;
};

// initAta and mint tokens
export const mintToken = async (
	conn: anchor.web3.Connection,
	mintUiAmt: number,
	toAddr: PublicKey,
	mint: PublicKey,
	names = "token_user",
) => {
	const payerKp = mintAuthKp;
	const mintAuthority = mintAuthKp; //MUST BE Keypair!!!
	const namesArray = names.split(" ");
	if (namesArray.length < 2) throw new Error("names must have 2 names");
	const tokenName = namesArray[0] as string;
	const decimals = usdtDecimals; //from tokenName
	const toAddrName = namesArray[1] as string;

	const userAtaAccount = await getOrCreateAssociatedTokenAccount(
		conn,
		payerKp,
		mint,
		toAddr,
		false,
		undefined,
		undefined,
		tokenProg,
	);
	const userAta = userAtaAccount.address;
	ll(toAddrName, "ata", userAta.toBase58());

	//for frontend to find the token address
	const userAta_frontend = getAssociatedTokenAddressSync(
		mint,
		toAddr,
		false, //allowOwnerOffCurve
		tokenProg,
	); //in frontend: allowOwnerOffCurve = false
	ll(toAddrName, "ata_frontend", userAta_frontend.toBase58());

	await mintTo(
		conn,
		payerKp,
		mint,
		userAta,
		mintAuthority,
		10 ** decimals * mintUiAmt,
		[],
		undefined,
		tokenProg,
	);
	await balcToken(conn, userAta, toAddrName, tokenName);
	return userAta;
};

export const svmSetTokenAcct = (
	svm: LiteSVM,
	owner: PublicKey,
	mint: PublicKey,
	amount: bigint,
) => {
	ll("svmSetTokenAcct()");
	const amtLamports = 1 * LAMPORTS_PER_SOL;
	const ata = getAssociatedTokenAddressSync(mint, owner, true, tokenProg);
	const tokenAccData = Buffer.alloc(ACCOUNT_SIZE);
	AccountLayout.encode(
		{
			mint: mint,
			owner,
			amount: amount,
			delegateOption: 0,
			delegate: PublicKey.default,
			delegatedAmount: 0n,
			state: 1,
			isNativeOption: 0,
			isNative: 0n,
			closeAuthorityOption: 0,
			closeAuthority: PublicKey.default,
		},
		tokenAccData,
	);
	svm.setAccount(ata, {
		lamports: amtLamports,
		data: tokenAccData,
		owner: tokenProg,
		executable: false,
	});
	return ata;
};
export const svmGetTokenAmt = (svm: LiteSVM, ata: PublicKey) => {
	ll("svmGetTokenAmt()");
	const rawAccount = svm.getAccount(ata);
	if (rawAccount === null) throw new Error("rawAccount should not be null");
	//expect(rawAccount).not.null;
	const rawAccountData = rawAccount?.data!;
	const decoded = AccountLayout.decode(rawAccountData);
	ll("decoded.amount:", decoded.amount);
	return decoded.amount;
};
export type SolanaAccount = {
	account: {
		data: string[];
		executable: boolean;
		lamports: number;
		owner: string;
		rentEpoch: number;
		space: number;
	};
	pubkey: string;
};
//-------------------==
export const delayFunc = (delay: number): Promise<boolean> =>
	new Promise((resolve, reject) =>
		setTimeout(() => {
			ll("delay:", delay);
			resolve(true); //or reject()
		}, delay),
	);
export const time = () => Math.floor(Date.now() / 1000);

export const llbl = (text: string) => {
	ll(chalk.blue(text));
};
export const llgn = (text: string) => {
	ll(chalk.green(text));
};
export const unixToLocal = (UNIX_timestamp: number) => {
	//toLocaleDateString("en-US");
	ll("in unixToLocal():", UNIX_timestamp);
	const a = new Date(UNIX_timestamp * 1000);
	const month = a.toLocaleDateString(undefined, { month: "short" });
	const year = a.getFullYear();
	//let month = months[a.getMonth()];
	const date = a.getDate();
	const hour = a.getHours();

	const min = a.getMinutes() < 10 ? `0${a.getMinutes()}` : a.getMinutes();
	const sec = a.getSeconds() < 10 ? `0${a.getSeconds()}` : a.getSeconds();

	const time = `${year} ${month} ${date} ${hour}:${min}:${sec}`;
	return time;
};
