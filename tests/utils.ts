import type * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import chalk from "chalk";

export const ll = console.log;
export const bn = (num: number | string) => new BN(num);
export const zero = bn(0);

export const usdcMint = new PublicKey(
	"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);
export const usdtMint = new PublicKey(
	"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
);
export const bigSol = (amt: number) => BigInt(LAMPORTS_PER_SOL * amt);

export type ConfigT = {
	owner: PublicKey;
	balance: anchor.BN;
	time: number;
};

export const getConfigAcct = (
	programId: PublicKey,
	pdaName: string,
): PublicKey => {
	const [configPbk, configBump] = PublicKey.findProgramAddressSync(
		[Buffer.from("future_option_market_config")],
		programId,
	);
	ll(pdaName, ":", configPbk.toBase58());
	return configPbk;
};

export const delayFunc = (delay: number): Promise<boolean> =>
	new Promise((resolve, reject) =>
		setTimeout(() => {
			ll("delay:", delay);
			resolve(true); //or reject()
		}, delay),
	);

export const llbl = (text: string) => {
	console.log(chalk.blue(text));
};
export const llgn = (text: string) => {
	console.log(chalk.green(text));
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
