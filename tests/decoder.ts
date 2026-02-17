//import * as borsh from "@coral-xyz/borsh";
//import { cstr, struct, u8, u32 } from "@solana/buffer-layout";
//import { bool, publicKey, u64 } from "@solana/buffer-layout-utils";
import type {
	Address,
	FixedSizeDecoder,
	ReadonlyUint8Array,
} from "@solana/kit";
import {
	fixDecoderSize,
	//fixDecoderSize,
	getAddressDecoder,
	getBytesDecoder,
	//getBooleanDecoder,
	//getEnumDecoder,
	getStructDecoder,
	//getU8Decoder,
	getU32Decoder,
	getU64Decoder,
	//getUtf8Decoder,
} from "@solana/kit";
import { PublicKey } from "@solana/web3.js";

const ll = console.log;
//---------------== ConfigPDA
export type ConfigAcct = {
	anchorDiscriminator: ReadonlyUint8Array;
	unique: Address;
	progOwner: Address;
	admin: Address;
	adminPda: Address;
	adminPdaAta: Address;
	tokenProgram: Address;
	mint: Address;
	newU32: number;
	newU64: bigint;
}; //padding: bigint[];
export const configAcctDecoder: FixedSizeDecoder<ConfigAcct> = getStructDecoder(
	[
		["anchorDiscriminator", fixDecoderSize(getBytesDecoder(), 8)], //only for accounts made by Anchor
		["unique", getAddressDecoder()],
		["progOwner", getAddressDecoder()],
		["admin", getAddressDecoder()],
		["adminPda", getAddressDecoder()],
		["adminPdaAta", getAddressDecoder()],
		["tokenProgram", getAddressDecoder()],
		["mint", getAddressDecoder()],
		//["str", fixDecoderSize(getUtf8Decoder(), 32)],
		["newU32", getU32Decoder()],
		["newU64", getU64Decoder()],
		//["padding", getArrayDecoder(getU64Decoder(), { size: 3 })],
	],
);
export const solanaKitDecodeConfig = (
	bytes: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>,
	isVerbose = false,
) => {
	const decoded = configAcctDecoder.decode(bytes);
	if (isVerbose) {
		ll("unique:", decoded.unique);
		ll("progOwner:", decoded.progOwner);
		ll("admin:", decoded.admin);
		ll("adminPda:", decoded.adminPda);
		ll("adminPdaAta:", decoded.adminPdaAta);
		ll("tokenProgram:", decoded.tokenProgram);
		ll("mint:", decoded.mint);
		//ll("str:", decoded.str);
		ll("newU32:", decoded.newU32);
		ll("newU64:", decoded.newU64);
	}
	return decoded;
};
// This below is only used for testing as it is outputing PublicKey, not Address
export const solanaKitDecodeConfigDev = (
	bytes: ReadonlyUint8Array | Uint8Array<ArrayBufferLike> | undefined,
) => {
	if (!bytes) throw new Error("bytes invalid");
	const decoded = solanaKitDecodeConfig(bytes, true);
	const decodedV1: ConfigAcctDev = {
		unique: new PublicKey(decoded.unique.toString()),
		progOwner: new PublicKey(decoded.progOwner.toString()),
		admin: new PublicKey(decoded.admin.toString()),
		adminPda: new PublicKey(decoded.adminPda.toString()),
		adminPdaAta: new PublicKey(decoded.adminPdaAta.toString()),
		tokenProgram: new PublicKey(decoded.tokenProgram.toString()),
		mint: new PublicKey(decoded.mint.toString()),
		//str: decoded.str,
		newU32: decoded.newU32,
		newU64: decoded.newU64,
	};
	return decodedV1;
};
export type ConfigAcctDev = {
	unique: PublicKey;
	progOwner: PublicKey;
	admin: PublicKey;
	adminPda: PublicKey;
	adminPdaAta: PublicKey;
	tokenProgram: PublicKey;
	mint: PublicKey;
	newU32: number;
	newU64: bigint;
};
