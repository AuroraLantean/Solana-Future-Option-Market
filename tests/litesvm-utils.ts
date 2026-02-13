import { expect } from "bun:test";
import {
	type Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import {
	ComputeBudget,
	type FailedTransactionMetadata,
	LiteSVM,
	type SimulatedTransactionInfo,
	TransactionMetadata,
} from "litesvm";
import { type SolanaAccount, strToU8Array32 } from "./utils.ts";
import {
	addrFutureOption,
	admin,
	hacker,
	owner,
	type PriceFeed,
	user1,
	user2,
	user3,
} from "./web3jsSetup.ts";

const ll = console.log;
ll("\n------== litesvm-utils");
export let svm = new LiteSVM();

export const initSolBalc = BigInt(LAMPORTS_PER_SOL) * BigInt(10);
ll("initialize accounts by airdropping SOLs");
svm.airdrop(owner, initSolBalc);
svm.airdrop(admin, initSolBalc);
svm.airdrop(user1, initSolBalc);
svm.airdrop(user2, initSolBalc);
svm.airdrop(user3, initSolBalc);
svm.airdrop(hacker, initSolBalc);

export const acctIsNull = (account: PublicKey) => {
	const raw = svm.getAccount(account);
	expect(raw).toBeNull();
};
export const acctExists = (account: PublicKey) => {
	const raw = svm.getAccount(account);
	expect(raw).not.toBeNull();
};
//-------------== Program Methods
export const pythOracle = (signer: Keypair, pricefeed: PriceFeed) => {
	const disc = [121, 193, 165, 234, 80, 102, 132, 189]; //copied from Anchor IDL
	const argData = [...strToU8Array32(pricefeed.feedId)];

	const blockhash = svm.latestBlockhash();
	const ix = new TransactionInstruction({
		keys: [
			{ pubkey: signer.publicKey, isSigner: true, isWritable: true },
			{ pubkey: pricefeed.addr, isSigner: false, isWritable: true },
		],
		programId: addrFutureOption,
		data: Buffer.from([...disc, ...argData]),
	});
	sendTxns(svm, blockhash, [ix], [signer]);
};

//---------------==
export const setPriceFeedPda = (pricefeed: PriceFeed) => {
	//const file = Bun.file(path);
	// await file.json();
	ll("addr:", pricefeed.addr.toBase58());
	ll("jsonData:", pricefeed.json);
	const account = pricefeed.json.account;

	if (account.data.length < 2)
		throw new Error("account data should have length 2");
	// biome-ignore lint/style/noNonNullAssertion: <>
	const data = Uint8Array.fromBase64(account.data[0]!);
	ll("data:", data);
	ll("lamports:", account.lamports);
	svm.setAccount(pricefeed.addr, {
		lamports: account.lamports,
		data,
		owner: new PublicKey(account.owner),
		executable: account.executable,
		//rentEpoch: account.rentEpoch,
	});
};
export const deployProgram = (computeMaxUnits?: bigint) => {
	ll("deployProgram...");
	if (computeMaxUnits) {
		const computeBudget = new ComputeBudget();
		computeBudget.computeUnitLimit = computeMaxUnits;
		svm = svm.withComputeBudget(computeBudget);
	}
	const programPath = "target/deploy/future_option_market.so";
	//# Dump a program from mainnet
	//solana program dump progAddr pyth.so --url mainnet-beta

	svm.addProgramFromFile(addrFutureOption, programPath);
	//return [programId];
};
deployProgram();
acctExists(addrFutureOption);

//---------------==
export const sendTxns = (
	svm: LiteSVM,
	blockhash: string,
	ixs: TransactionInstruction[],
	signerKps: Keypair[],
	expectedError = "",
	programId = addrFutureOption,
) => {
	const tx = new Transaction();
	tx.recentBlockhash = blockhash;
	tx.add(...ixs);
	tx.sign(...signerKps); //first signature is considered "primary" and is used identify and confirm transactions.
	const simRes = svm.simulateTransaction(tx);
	const sendRes = svm.sendTransaction(tx);
	checkLogs(simRes, sendRes, programId, expectedError);
};
export const checkLogs = (
	simRes: FailedTransactionMetadata | SimulatedTransactionInfo,
	sendRes: TransactionMetadata | FailedTransactionMetadata,
	programId: PublicKey,
	expectedError = "",
	isVerbose = false,
) => {
	ll("\nsimRes meta prettylogs:", simRes.meta().prettyLogs());
	if (isVerbose) {
		ll("\nsimRes.meta().logs():", simRes.meta().logs());
	}
	/** simRes.meta():
      computeUnitsConsumed: [class computeUnitsConsumed],
      innerInstructions: [class innerInstructions],
      logs: [class logs],
      prettyLogs: [class prettyLogs],
      returnData: [class returnData],
      signature: [class signature],
      toString: [class toString], */
	if (sendRes instanceof TransactionMetadata) {
		expect(simRes.meta().logs()).toStrictEqual(sendRes.logs());

		const logLength = simRes.meta().logs().length;
		//ll("logLength:", logLength);
		//ll("sendRes.logs()[logIndex]:", sendRes.logs()[logIndex]);
		expect(sendRes.logs()[logLength - 1]).toStrictEqual(
			`Program ${programId} success`,
		);
	} else {
		ll("sendRes.err():", sendRes.err());
		ll("sendRes.meta():", sendRes.meta());
		const errStr = sendRes.toString();
		ll("sendRes.toString():", errStr);
		const pos = errStr.search("custom program error: 0x");
		ll("pos:", pos);
		if (pos > -1) {
			let errCode = errStr.substring(pos + 22, pos + 26);
			if (errCode.slice(-1) === '"') {
				//ll("last char:", errCode.slice(-1));
				errCode = errCode.slice(0, -1);
			}
			ll("error code:", errCode, Number(errCode));
		}
		ll(
			"find error here: https://docs.rs/solana-sdk/latest/solana_sdk/transaction/enum.TransactionError.html",
		);
		if (expectedError) {
			const foundErrorMesg = sendRes
				.toString()
				.includes(`custom program error: ${expectedError}`);
			ll("found error?:", foundErrorMesg);
			expect(foundErrorMesg).toEqual(true);
		} else {
			throw new Error("This error is unexpected");
		}
	}
};
