import { appendFile } from "node:fs";
import {
	type AccountMeta,
	createJupiterApiClient,
	type Instruction,
	type QuoteGetRequest,
	type QuoteResponse,
	ResponseError,
	type SwapApi,
} from "@jup-ag/api";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
	AddressLookupTableAccount,
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	type SignatureStatus,
	type TransactionConfirmationStatus,
	TransactionInstruction,
	TransactionMessage,
	type TransactionSignature,
	VersionedTransaction,
} from "@solana/web3.js";

export const solEndpoint = Bun.env.QUICKBOOK_METIS_ENDPOINT; // or use public api https://www.jupiterapi.com/`; // See https://www.jupiterapi.com/?utm_source=guides-jup-trading-bot

export const solanaMainnetAPI = Bun.env.QUICKBOOK_SOLANA_MAINNET;

const CONFIG = {
	basePath: solEndpoint,
};
const jupiterApi = createJupiterApiClient(CONFIG);

const quote = await jupiterApi
	.quoteGet({
		inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		outputMint: "So11111111111111111111111111111111111111112",
		amount: 100_000_000,
	})
	.catch((error) => {
		console.error(error);
	});
console.log(quote?.outAmount, quote?.outputMint);

export interface ArbBotConfig {
	solanaEndpoint: string; // e.g., "https://ex-am-ple.solana-mainnet.quiknode.pro/123456/"
	metisEndpoint: string; // e.g., "https://jupiter-swap-api.quiknode.pro/123456/"
	secretKey: Uint8Array; //our wallet
	firstTradePrice: number; // token we want to buy
	targetGainPercentage?: number; //our next trade will only execute if we have gained this percentage[0.00~1.00] in the previous trade
	checkInterval?: number; //to check price
	initialInputToken: SwapToken; //initial token to swap for our next token
	initialInputAmount: number; //initial amount of the above token
}

export interface NextTrade extends QuoteGetRequest {
	nextTradeThreshold: number;
}

export enum SwapToken {
	SOL,
	USDC,
}

export interface LogSwapArgs {
	inputToken: string;
	inAmount: string;
	outputToken: string;
	outAmount: string;
	txId: string;
	timestamp: string;
}

//----------------==
export class ArbBot {
	private solanaConnection: Connection;
	private jupiterApi: SwapApi;
	private wallet: Keypair;
	private usdcMint: PublicKey = new PublicKey(
		"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
	);
	private solMint: PublicKey = new PublicKey(
		"So11111111111111111111111111111111111111112",
	);
	private usdcTokenAccount: PublicKey;
	private solBalance: number = 0;
	private usdcBalance: number = 0;
	private checkInterval: number = 1000 * 10;
	private lastCheck: number = 0;
	private priceWatchIntervalId?: NodeJS.Timeout;
	private targetGainPercentage: number = 1;
	private nextTrade: NextTrade;
	private waitingForConfirmation: boolean = false;

	constructor(config: ArbBotConfig) {
		const {
			solanaEndpoint,
			metisEndpoint,
			secretKey,
			targetGainPercentage,
			checkInterval,
			initialInputToken,
			initialInputAmount,
			firstTradePrice,
		} = config;
		this.solanaConnection = new Connection(solanaEndpoint);
		this.jupiterApi = createJupiterApiClient({ basePath: metisEndpoint });
		this.wallet = Keypair.fromSecretKey(secretKey);
		this.usdcTokenAccount = getAssociatedTokenAddressSync(
			this.usdcMint,
			this.wallet.publicKey,
		);
		if (targetGainPercentage) {
			this.targetGainPercentage = targetGainPercentage;
		}
		if (checkInterval) {
			this.checkInterval = checkInterval;
		}
		this.nextTrade = {
			inputMint:
				initialInputToken === SwapToken.SOL
					? this.solMint.toBase58()
					: this.usdcMint.toBase58(),
			outputMint:
				initialInputToken === SwapToken.SOL
					? this.usdcMint.toBase58()
					: this.solMint.toBase58(),
			amount: initialInputAmount,
			nextTradeThreshold: firstTradePrice,
		};
	}
	async init(): Promise<void> {
		console.log(
			`🤖 Initiating arb bot for wallet: ${this.wallet.publicKey.toBase58()}.`,
		);
		await this.refreshBalances();
		console.log(
			`🏦 Current balances:\nSOL: ${this.solBalance / LAMPORTS_PER_SOL},\nUSDC: ${this.usdcBalance}`,
		);
		//this.initiatePriceWatch();
	}

	private async refreshBalances(): Promise<void> {
		try {
			const results = await Promise.allSettled([
				this.solanaConnection.getBalance(this.wallet.publicKey),
				this.solanaConnection.getTokenAccountBalance(this.usdcTokenAccount),
			]);

			const solBalanceResult = results[0];
			const usdcBalanceResult = results[1];

			if (solBalanceResult.status === "fulfilled") {
				this.solBalance = solBalanceResult.value;
			} else {
				console.error("Error fetching SOL balance:", solBalanceResult.reason);
			}

			if (usdcBalanceResult.status === "fulfilled") {
				this.usdcBalance = usdcBalanceResult.value.value.uiAmount ?? 0;
			} else {
				this.usdcBalance = 0;
			}

			if (this.solBalance < LAMPORTS_PER_SOL / 100) {
				this.terminateSession("Low SOL balance.");
			}
		} catch (error) {
			console.error("Unexpected error during balance refresh:", error);
		}
	}

	private terminateSession(reason: string): void {
		console.warn(`❌ Terminating bot...${reason}`);
		console.log(
			`Current balances:\nSOL: ${this.solBalance / LAMPORTS_PER_SOL},\nUSDC: ${this.usdcBalance}`,
		);
		if (this.priceWatchIntervalId) {
			clearInterval(this.priceWatchIntervalId);
			this.priceWatchIntervalId = undefined; // Clear the reference to the interval
		}
		setTimeout(() => {
			console.log("Bot has been terminated.");
			process.exit(1);
		}, 1000);
	}
}
