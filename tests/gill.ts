import {
	type Address,
	address,
	createSolanaClient,
	createTransaction,
	generateExtractableKeyPairSigner,
	generateKeyPairSigner,
	getExplorerLink,
	getSignatureFromTransaction,
	type KeyPairSigner,
	type Rpc,
	type SolanaClusterMoniker,
	signTransactionMessageWithSigners,
	type TransactionSigner,
} from "gill";
import { loadKeypairSignerFromFile, saveKeypairSignerToFile } from "gill/node";
import {
	buildCreateTokenTransaction,
	buildMintTokensTransaction,
	buildTransferTokensTransaction,
	getAssociatedTokenAccountAddress,
	TOKEN_PROGRAM_ADDRESS,
} from "gill/programs/token";

import { ll } from "./utils.ts";

export const newKeypair = async (path: string) => {
	const extractableSigner: KeyPairSigner =
		await generateExtractableKeyPairSigner();
	await saveKeypairSignerToFile(extractableSigner, path);
};

export const makeMintViaGill = async (
	customRpcURL: string,
	cluster: SolanaClusterMoniker,
	signer: KeyPairSigner,
	decimals: number,
	tokenProgram: Address<string>,
) => {
	const { rpc, rpcSubscriptions, sendAndConfirmTransaction } =
		createSolanaClient(
			{
				urlOrMoniker: customRpcURL,
			}, //devnet, localnet, mainnet
		);

	const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
	ll("latestBlockhash:", latestBlockhash);
	//non-extractable
	const mint = await generateKeyPairSigner();
	ll("mint:", mint.address);

	const createTokenTx = await buildCreateTokenTransaction({
		feePayer: signer,
		latestBlockhash,
		mint,
		// mintAuthority, // default=same as the `feePayer`
		metadata: {
			isMutable: true, // if the `updateAuthority` can change this metadata in the future
			name: "Lion with wings",
			symbol: "LWW",
			uri: "https://peach-tough-crayfish-991.mypinata.cloud/ipfs/bafkreiagrzfdzrb7gykfhimmqsrrqxe7z47ql4howvbdi45r74g634rh2i",
		},
		// updateAuthority, // default=same as the `feePayer`
		decimals, // default=9,
		tokenProgram, // TOKEN_PROGRAM_ADDRESS OR TOKEN_2022_PROGRAM_ADDRESS
		// default cu limit set to be optimized, but can be overriden here
		// computeUnitLimit?: number,
		// obtain from your favorite priority fee api
		// computeUnitPrice?: number, // no default set
	});
	const signedTransaction =
		await signTransactionMessageWithSigners(createTokenTx);
	ll("signedTransaction:", signedTransaction);

	const signature = getSignatureFromTransaction(signedTransaction);
	ll("signature:", signature);

	const link = getExplorerLink({
		cluster,
		transaction: signature,
	});
	ll("Explorer Link of the new mint:", link);
	await sendAndConfirmTransaction(signedTransaction);
};

export const mintTokensViaGill = async (
	customRpcURL: string,
	cluster: SolanaClusterMoniker,
	signer: KeyPairSigner,
	mint: Address<string>,
	amountUI: number,
	decimals: number,
	mintToDestination: Address<string>,
	tokenProgram: Address<string>,
) => {
	const amount = BigInt(amountUI) * BigInt(10 ** decimals);

	const { rpc, rpcSubscriptions, sendAndConfirmTransaction } =
		createSolanaClient(
			{
				urlOrMoniker: customRpcURL,
			}, //devnet, localnet, mainnet
		);
	const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
	ll("latestBlockhash:", latestBlockhash);

	const mintTokensTx = await buildMintTokensTransaction({
		feePayer: signer,
		latestBlockhash,
		mint,
		mintAuthority: signer,
		amount, // note: be sure to consider the mint's `decimals` value
		// if decimals=2 => this will mint 20.00 tokens
		// if decimals=4 => this will mint 0.200 tokens
		destination: mintToDestination,
		// use the correct token program for the `mint`
		tokenProgram, // default=TOKEN_PROGRAM_ADDRESS
		// default cu limit set to be optimized, but can be overridden here
		// computeUnitLimit?: number,
		// obtain from your favorite priority fee api
		// computeUnitPrice?: number, // no default set
	});
	ll("mintTokensTx:", mintTokensTx);

	const signedTransaction =
		await signTransactionMessageWithSigners(mintTokensTx);
	ll("signedTransaction:", signedTransaction);

	const signature = getSignatureFromTransaction(signedTransaction);
	ll("signature:", signature);
	const link = getExplorerLink({
		cluster,
		transaction: signature,
	});
	ll("Explorer Link of the new mint:", link);
	await sendAndConfirmTransaction(signedTransaction);
};

export const sendTokenViaGill = async (
	customRpcURL: string,
	cluster: SolanaClusterMoniker,
	signer: KeyPairSigner,
	authority: Address | TransactionSigner,
	mint: Address<string>,
	destination: Address<string>,
	amountUI: number,
	decimals: number,
	tokenProgram: Address<string>,
) => {
	const amount = BigInt(amountUI) * BigInt(10 ** decimals);

	const { rpc, rpcSubscriptions, sendAndConfirmTransaction } =
		createSolanaClient(
			{
				urlOrMoniker: customRpcURL,
			}, //devnet, localnet, mainnet
		);
	const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
	ll("latestBlockhash:", latestBlockhash);

	const transferTokensTx = await buildTransferTokensTransaction({
		feePayer: signer,
		latestBlockhash,
		mint,
		authority,
		amount, // note: be sure to consider the mint's `decimals` value
		// if decimals=2 => this will mint 9.00 tokens
		destination,
		// use the correct token program for the `mint`
		tokenProgram, // default=TOKEN_PROGRAM_ADDRESS
		// default cu limit set to be optimized, but can be overridden here
		// computeUnitLimit?: number,
		// obtain from your favorite priority fee api
		// computeUnitPrice?: number, // no default set
	});

	const signedTransaction =
		await signTransactionMessageWithSigners(transferTokensTx);
	ll("signedTransaction:", signedTransaction);

	const signature = getSignatureFromTransaction(signedTransaction);

	ll("signature:", signature);
	const link = getExplorerLink({
		cluster,
		transaction: signature,
	});
	ll("Explorer Link of the new mint:", link);
	await sendAndConfirmTransaction(signedTransaction);
};

export const latestBlockhashSlot = async (customRpcURL: string) => {
	const { rpc, rpcSubscriptions, sendAndConfirmTransaction } =
		createSolanaClient(
			{
				urlOrMoniker: customRpcURL,
			}, //devnet, localnet, mainnet
		);
	const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
	ll("latestBlockhash:", latestBlockhash);

	const slot = await rpc.getSlot().send();
	ll("slot:", slot);
};

export const tokenBalcViaGill = async (
	customRpcURL: string,
	target: Address<string>,
	mint: Address<string>,
	tokenProgram: Address<string>,
) => {
	const { rpc } = createSolanaClient(
		{
			urlOrMoniker: customRpcURL,
		}, //devnet, localnet, mainnet
	);
	const ata = await getAssociatedTokenAccountAddress(
		mint,
		target,
		tokenProgram,
	);
	const { value: balc } = await rpc.getTokenAccountBalance(ata).send();
	ll("token balance at:", target, balc);
	return balc;
};
