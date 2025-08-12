declare module "bun" {
	interface Env {
		SOLANA_MAINNET_HTTPS1: string;
		SOLANA_MAINNET_HTTPS2: string;
		SOLANA_MAINNET_HTTPS3: string;
		SOLANA_DEVNET_HTTPS1: string;
		SOLANA_DEVNET_HTTPS2: string;
		SOLANA_DEVNET_HTTPS3: string;
		SOLANA_ADDR0: string;
		SOLANA_ADDR1: string;
		SOLANA_ADDR2: string;
		SOLANA_ADDR3: string;
		WINGLIONMINT: string;
		LIONWITHWINGS_URI: string;
		QUICKBOOK_SOLANA_MAINNET: string;
		QUICKBOOK_METIS_ENDPOINT: string;
	}
}
export const privkey = Bun.env.PRIVKEY;
export const solanaEndpoint = Bun.env.QUICKNODE_URL;
export const solanaSecretKey = Bun.env.WALLET_SECRET_KEY;

export const solEndpoint = Bun.env.QUICKBOOK_METIS_ENDPOINT; // or use public api https://www.jupiterapi.com/`; // See https://www.jupiterapi.com/?utm_source=guides-jup-trading-bot
