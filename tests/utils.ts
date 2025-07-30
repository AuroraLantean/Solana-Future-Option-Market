import type * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

export const ll = console.log;
export const bn = (num: number | string) => new BN(num);
export const zero = bn(0);

export type ConfigT = {
	owner: PublicKey;
	balance: anchor.BN;
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
