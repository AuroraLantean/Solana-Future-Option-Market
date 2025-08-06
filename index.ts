import { getMint } from "@solana/spl-token";
import { Connection } from "@solana/web3.js";
import { address, type SolanaClusterMoniker } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { TOKEN_PROGRAM_ADDRESS } from "gill/programs/token";
import {
	latestBlockhashSlot,
	makeMintViaGill,
	mintTokensViaGill,
	newKeypair,
	sendTokenViaGill,
	tokenBalcViaGill,
} from "./backend/gill.ts";
import { ll, usdtMint } from "./tests/utils.ts";

const args = Bun.argv;
const arg0 = args.length > 2 ? args[2] : "";

//Gill https://github.com/DecalLabs/gill
const customRpcURL = Bun.env.SOLANA_DEVNET_HTTPS1;
const cluster: SolanaClusterMoniker = "devnet";

const signer = await loadKeypairSignerFromFile();
//await loadKeypairSignerFromFile("/path/to/your/keypair.json");
ll("address:", signer.address);

const tokenProgram = TOKEN_PROGRAM_ADDRESS;
//const tokenProgram = TOKEN_2022_PROGRAM_ADDRESS;
const decimals = 9;

const mint = address(Bun.env.WINGLIONMINT);
const mintToDestination = address(Bun.env.SOLANA_ADDR3);
const addr2 = address(Bun.env.SOLANA_ADDR2);
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
			const pathToSaveKp = "your/path";
			await newKeypair(pathToSaveKp);
		}
		break;
	case "g11": //check connection
		{
			await latestBlockhashSlot(customRpcURL);
		}
		break;
	case "g12": // make mint
		{
			await makeMintViaGill(
				customRpcURL,
				cluster,
				signer,
				decimals,
				tokenProgram,
			);
		}
		break;
	case "g13": //mint tokens
		{
			const amountUI = 900 * 1000000;
			await mintTokensViaGill(
				customRpcURL,
				cluster,
				signer,
				mint,
				amountUI,
				decimals,
				mintToDestination,
				tokenProgram,
			);
		}
		break;
	case "g14": //send tokens
		{
			const amountUI = 10;
			const dest = addr2;
			await sendTokenViaGill(
				customRpcURL,
				cluster,
				signer,
				signer,
				mint,
				dest,
				amountUI,
				decimals,
				tokenProgram,
			);
		}
		break;
	case "g15": //get token balance
		{
			const target = addr2;
			await tokenBalcViaGill(customRpcURL, target, mint, tokenProgram);
		}
		break;
	default: //bun run index.ts g15
		ll("unknown selection");
}
process.exit();
