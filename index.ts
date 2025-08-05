import { getMint } from "@solana/spl-token";
import { Connection } from "@solana/web3.js";
import {
	address,
	createSolanaClient,
	createTransaction,
	generateExtractableKeyPairSigner,
	generateKeyPairSigner,
	getExplorerLink,
	getSignatureFromTransaction,
	type KeyPairSigner,
	type SolanaClusterMoniker,
	signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile, saveKeypairSignerToFile } from "gill/node";
import {
	buildCreateTokenTransaction,
	buildMintTokensTransaction,
	buildTransferTokensTransaction,
	getAssociatedTokenAccountAddress,
	TOKEN_PROGRAM_ADDRESS,
} from "gill/programs/token";

import { ll, usdtMint } from "./tests/utils.ts";

const args = Bun.argv;
const arg0 = args.length > 2 ? args[2] : "";

//Gill https://github.com/DecalLabs/gill
const customRpcURL = Bun.env.SOLANA_DEVNET_HTTPS1;
const cluster: SolanaClusterMoniker = "devnet";
const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient(
	{
		urlOrMoniker: customRpcURL,
	}, //devnet, localnet, mainnet
);
const signer = await loadKeypairSignerFromFile();
//await loadKeypairSignerFromFile("/path/to/your/keypair.json");
ll("address:", signer.address);

const tokenProgram = TOKEN_PROGRAM_ADDRESS;
//const tokenProgram = TOKEN_2022_PROGRAM_ADDRESS;
const decimals = 9;

const mint = address(Bun.env.WINGLIONMINT);
const mintToDestination = address(Bun.env.SOLANA_ADDR3);
const transferToDestination = address(Bun.env.SOLANA_ADDR2);
ll("args:", mint, mintToDestination);

//bun run index.ts g11
switch (arg0) {
	case "0":
		{
			const connection = new Connection("https://api.mainnet-beta.solana.com");
			const accountInfo = await connection.getAccountInfo(usdtMint);
			ll(accountInfo);
			const mintData = await getMint(connection, usdtMint, "confirmed");
			ll("mintData:", mintData);
			/*{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "mintAuthority": "BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG",
  "supply": "8985397351591790",
  "decimals": 6,
  "isInitialized": true,
  "freezeAuthority": "7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar",
  "tlvData": {
    "type": "Buffer",
    "data": []
  }
} */
		}
		break;
	case "g10": //generate and save a keypair
		{
			//const signer: KeyPairSigner = await generateKeyPairSigner();//non-extractable
			const extractableSigner: KeyPairSigner =
				await generateExtractableKeyPairSigner();
			await saveKeypairSignerToFile(extractableSigner, "/file/path");
		}
		break;
	case "g11": //check connection
		{
			const slot = await rpc.getSlot().send();
			ll("slot:", slot);
		}
		break;
	case "g12": // make mint
		{
			const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
			ll("latestBlockhash:", latestBlockhash);

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
		}
		break;
	case "g13": //mint tokens
		{
			const amount = BigInt(900 * 1000000) * BigInt(10 ** decimals);

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
		}
		break;
	case "g14": //send tokens
		{
			const senderOrDelegatedAuthority = signer;
			ll(
				"transfer from:",
				senderOrDelegatedAuthority,
				"to destination:",
				transferToDestination,
			);

			const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
			ll("latestBlockhash:", latestBlockhash);

			const transferTokensTx = await buildTransferTokensTransaction({
				feePayer: signer,
				latestBlockhash,
				mint,
				authority: senderOrDelegatedAuthority,
				amount: 1000000000, // note: be sure to consider the mint's `decimals` value
				// if decimals=2 => this will mint 9.00 tokens
				destination: transferToDestination,
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
		}
		break;
	case "g15": //get token balance
		{
			const target = transferToDestination;
			const ata = await getAssociatedTokenAccountAddress(
				mint,
				target,
				tokenProgram,
			);
			const { value: balc } = await rpc.getTokenAccountBalance(ata).send();

			ll("token balance at:", mintToDestination, balc);
		}
		break;
	default:
		ll("unknown selection");
}
process.exit();
