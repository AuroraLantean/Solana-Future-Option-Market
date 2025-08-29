//Mint a Solana NFT with the SPL Metadata Token Extension

import {
	AuthorityType,
	createAssociatedTokenAccountIdempotent,
	createInitializeMetadataPointerInstruction,
	createInitializeMintInstruction,
	createSetAuthorityInstruction,
	ExtensionType,
	getMetadataPointerState,
	getMint,
	getMintLen,
	getTokenMetadata,
	LENGTH_SIZE,
	mintTo,
	TOKEN_2022_PROGRAM_ID,
	TYPE_SIZE,
} from "@solana/spl-token";
import {
	createInitializeInstruction,
	createRemoveKeyInstruction,
	createUpdateFieldInstruction,
	pack,
	type TokenMetadata,
} from "@solana/spl-token-metadata";
import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	type SignatureStatus,
	SystemProgram,
	sendAndConfirmTransaction,
	Transaction,
	type TransactionConfirmationStatus,
	type TransactionSignature,
} from "@solana/web3.js";

const connection = new Connection("http://127.0.0.1:8899", "confirmed");

const payer = Keypair.generate();
const authority = Keypair.generate();
const owner = Keypair.generate();
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

/**export interface TokenMetadata {
    // The authority that can sign to update the metadata
    updateAuthority?: PublicKey;
    // The associated mint, used to counter spoofing to be sure that metadata belongs to a particular mint
    mint: PublicKey;
    // The longer name of the token
    name: string;
    // The shortened symbol for the token
    symbol: string;
    // The URI pointing to richer metadata
    uri: string;
    // Any additional metadata about the token as key-value pairs
    additionalMetadata: [string, string][];
} */
const tokenMetadata: TokenMetadata = {
	updateAuthority: authority.publicKey,
	mint: mint,
	name: "QN Pixel",
	symbol: "QNPIX",
	uri: "https://qn-shared.quicknode-ipfs.com/ipfs/QmQFh6WuQaWAMLsw9paLZYvTsdL5xJESzcoSxzb6ZU3Gjx",
	additionalMetadata: [
		["Background", "Blue"],
		["WrongData", "DeleteMe!"],
		["Points", "0"],
	],
};

const decimals = 0;
const mintAmount = 1;

function generateExplorerUrl(
	identifier: string,
	isAddress: boolean = false,
): string {
	if (!identifier) return "";
	const baseUrl = "https://solana.fm";
	const localSuffix = "?cluster=localnet-solana";
	const slug = isAddress ? "address" : "tx";
	return `${baseUrl}/${slug}/${identifier}${localSuffix}`;
}

async function airdropLamports() {
	const airdropSignature = await connection.requestAirdrop(
		payer.publicKey,
		2 * LAMPORTS_PER_SOL,
	);
	async function confirmTransaction(
		connection: Connection,
		signature: TransactionSignature,
		desiredConfirmationStatus: TransactionConfirmationStatus = "confirmed",
		timeout: number = 30000,
		pollInterval: number = 1000,
		searchTransactionHistory: boolean = false,
	): Promise<SignatureStatus> {
		const start = Date.now();

		while (Date.now() - start < timeout) {
			const { value: statuses } = await connection.getSignatureStatuses(
				[signature],
				{ searchTransactionHistory },
			);

			if (!statuses || statuses.length === 0) {
				throw new Error("Failed to get signature status");
			}

			const status = statuses[0];

			if (status === null) {
				await new Promise((resolve) => setTimeout(resolve, pollInterval));
				continue;
			}

			if (status?.err) {
				throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
			}

			if (
				status?.confirmationStatus &&
				status.confirmationStatus === desiredConfirmationStatus
			) {
				return status;
			}

			if (status?.confirmationStatus === "finalized") {
				return status;
			}

			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}

		throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
	}

	await confirmTransaction(connection, airdropSignature);
}

export const mintNft = async () => {
	try {
		await airdropLamports();

		// 1. Create Token and Mint
		const [initSig, mintSig] = await createTokenAndMint();
		console.log(`Token created and minted:`);
		console.log(`   ${generateExplorerUrl(initSig)}`);
		console.log(`   ${generateExplorerUrl(mintSig)}`);

		// 2. Remove Metadata Field
		const cleanMetaTxId = await removeMetadataField();
		console.log(`Metadata field removed:`);
		console.log(`   ${generateExplorerUrl(cleanMetaTxId)}`);

		// 3. Remove Authority
		const removeAuthTxId = await removeTokenAuthority();
		console.log(`Authority removed:`);
		console.log(`   ${generateExplorerUrl(removeAuthTxId)}`);

		// 4. Increment Points
		const incrementPointsTxId = await incrementPoints(10);
		console.log(`Points incremented:`);
		console.log(`   ${generateExplorerUrl(incrementPointsTxId)}`);

		// Log New NFT
		console.log(`New NFT:`);
		console.log(`   ${generateExplorerUrl(mint.toBase58(), true)}`);
	} catch (err) {
		console.error(err);
	}
};

async function createTokenAndMint(): Promise<[string, string]> {
	// After calculating the minimum balance for the mint account...

	// Prepare transaction
	const transaction = new Transaction().add(
		SystemProgram.createAccount({
			fromPubkey: payer.publicKey,
			newAccountPubkey: mint,
			space: mintLen,
			lamports: mintLamports,
			programId: TOKEN_2022_PROGRAM_ID,
		}),
		createInitializeMetadataPointerInstruction(
			mint,
			authority.publicKey,
			mint,
			TOKEN_2022_PROGRAM_ID,
		),
		createInitializeMintInstruction(
			mint,
			decimals,
			authority.publicKey,
			null,
			TOKEN_2022_PROGRAM_ID,
		),
		createInitializeInstruction({
			programId: TOKEN_2022_PROGRAM_ID,
			metadata: mint,
			updateAuthority: authority.publicKey,
			mint: mint,
			mintAuthority: authority.publicKey,
			name: tokenMetadata.name,
			symbol: tokenMetadata.symbol,
			uri: tokenMetadata.uri,
		}),
		createUpdateFieldInstruction({
			programId: TOKEN_2022_PROGRAM_ID,
			metadata: mint,
			updateAuthority: authority.publicKey,
			field: tokenMetadata.additionalMetadata[0][0],
			value: tokenMetadata.additionalMetadata[0][1],
		}),
		createUpdateFieldInstruction({
			programId: TOKEN_2022_PROGRAM_ID,
			metadata: mint,
			updateAuthority: authority.publicKey,
			field: tokenMetadata.additionalMetadata[1][0],
			value: tokenMetadata.additionalMetadata[1][1],
		}),
		createUpdateFieldInstruction({
			programId: TOKEN_2022_PROGRAM_ID,
			metadata: mint,
			updateAuthority: authority.publicKey,
			field: tokenMetadata.additionalMetadata[2][0],
			value: tokenMetadata.additionalMetadata[2][1],
		}),
	);

	// Initialize NFT with metadata
	const initSig = await sendAndConfirmTransaction(connection, transaction, [
		payer,
		mintKeypair,
		authority,
	]);
	// Create associated token account
	const sourceAccount = await createAssociatedTokenAccountIdempotent(
		connection,
		payer,
		mint,
		owner.publicKey,
		{},
		TOKEN_2022_PROGRAM_ID,
	);
	// Mint NFT to associated token account
	const mintSig = await mintTo(
		connection,
		payer,
		mint,
		sourceAccount,
		authority,
		mintAmount,
		[],
		undefined,
		TOKEN_2022_PROGRAM_ID,
	);

	return [initSig, mintSig];
}

async function removeMetadataField() {
	const transaction = new Transaction().add(
		createRemoveKeyInstruction({
			programId: TOKEN_2022_PROGRAM_ID,
			metadata: mint,
			updateAuthority: authority.publicKey,
			key: "WrongData",
			idempotent: true,
		}),
	);
	const signature = await sendAndConfirmTransaction(connection, transaction, [
		payer,
		authority,
	]);
	return signature;
}

async function removeTokenAuthority(): Promise<string> {
	const transaction = new Transaction().add(
		createSetAuthorityInstruction(
			mint,
			authority.publicKey,
			AuthorityType.MintTokens,
			null,
			[],
			TOKEN_2022_PROGRAM_ID,
		),
	);
	return await sendAndConfirmTransaction(connection, transaction, [
		payer,
		authority,
	]);
}

async function incrementPoints(pointsToAdd: number = 1) {
	// Retrieve mint information
	const mintInfo = await getMint(
		connection,
		mint,
		"confirmed",
		TOKEN_2022_PROGRAM_ID,
	);

	const metadataPointer = getMetadataPointerState(mintInfo);

	if (!metadataPointer || !metadataPointer.metadataAddress) {
		throw new Error("No metadata pointer found");
	}

	const metadata = await getTokenMetadata(
		connection,
		metadataPointer?.metadataAddress,
	);

	if (!metadata) {
		throw new Error("No metadata found");
	}
	if (metadata.mint.toBase58() !== mint.toBase58()) {
		throw new Error("Metadata does not match mint");
	}
	const [key, currentPoints] =
		metadata.additionalMetadata.find(([key, _]) => key === "Points") ?? [];
	let pointsAsNumber = parseInt(currentPoints ?? "0");
	pointsAsNumber += pointsToAdd;
	const transaction = new Transaction().add(
		createUpdateFieldInstruction({
			programId: TOKEN_2022_PROGRAM_ID,
			metadata: mint,
			updateAuthority: authority.publicKey,
			field: "Points",
			value: pointsAsNumber.toString(),
		}),
	);
	return await sendAndConfirmTransaction(connection, transaction, [
		payer,
		authority,
	]);
}
