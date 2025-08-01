import { Connection, PublicKey } from "@solana/web3.js";
import { ll,  usdtMint } from "./tests/utils";
import { getMint } from "@solana/spl-token";

const args = Bun.argv;
const arg0 = args.length > 2 ? args[2] : "";

switch (arg0) {
	case "0":
		{
	const connection = new Connection("https://api.mainnet-beta.solana.com");
	const accountInfo = await connection.getAccountInfo(usdtMint);
  ll(accountInfo)
const mintData = await getMint(connection, usdtMint, "confirmed");
ll('mintData:', mintData)
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
	default:
		ll("unknown selection");
}
process.exit();