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
	}
}
export const privkey = Bun.env.PRIVKEY;
