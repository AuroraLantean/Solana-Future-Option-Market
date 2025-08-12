import {
	LAMPORTS_PER_SOL,
	PublicKey,
	type SimulatedTransactionResponse,
	Transaction,
	VersionedTransaction,
} from "@solana/web3.js";
import { ll } from "../tests/utils.ts";
import { CONFIG } from "./raydium-config.ts";
import { RaydiumSwap } from "./raydium-swap.ts";

//Bun https://bun.com/docs
//Raydium API V3: https://api-v3-devnet.raydium.io/docs/#/

//Raydium Addresses on Devnet: https://docs.raydium.io/raydium/protocol/developers/addresses

//To trade tokens:
//Find Pool-info by pair

export type PoolInfoList = {
	id: string;
	success: boolean;
	data: {
		count: number;
		data: [];
		hasNextPage: boolean;
	};
};
export const getResponse = async (endpoint: string) => {
	ll("endpoint:", endpoint);
	const response = await fetch(endpoint);
	const jsonResult = await response.json();
	ll("jsonResult:", jsonResult);
	return jsonResult;
};

export const post1 = async () => {
	const response = await fetch("https://bun.com/api", {
		method: "POST",
		body: JSON.stringify({ message: "Hello from Bun!" }),
		headers: { "Content-Type": "application/json" },
	});
	const jsonResult = await response.json();
	ll("jsonResult:", jsonResult);
};

/*Code used in the video: https://qn.social/QNCode-raydium-swap

Raydium V2 token pools: https://qn.social/QNRayPool-raydium-swap

Solana Priority Fee API docs: https://qn.social/QNPriDoc-raydium-swap */
async function getTokenBalance(
	raydiumSwap: RaydiumSwap,
	mint: string,
): Promise<number> {
	const userTokenAccounts = await raydiumSwap.getOwnerTokenAccounts();
	const tokenAccount = userTokenAccounts.find((account) =>
		account.accountInfo.mint.equals(new PublicKey(mint)),
	);
	if (tokenAccount) {
		const balance = await raydiumSwap.connection.getTokenAccountBalance(
			tokenAccount.pubkey,
		);
		return balance.value.uiAmount || 0;
	}
	return 0;
}

export const radiumSwap = async () => {
	ll("Starting swap process...");
	const raydiumSwap = new RaydiumSwap(CONFIG.RPC_URL, CONFIG.WALLET_SECRET_KEY);

	await raydiumSwap.loadPoolKeys();
	const poolInfo =
		raydiumSwap.findPoolInfoForTokens(CONFIG.BASE_MINT, CONFIG.QUOTE_MINT) ||
		(await raydiumSwap.findRaydiumPoolInfo(
			CONFIG.BASE_MINT,
			CONFIG.QUOTE_MINT,
		));

	if (!poolInfo) {
		throw new Error("Couldn't find the pool info");
	}

	await raydiumSwap.createWrappedSolAccountInstruction(CONFIG.TOKEN_A_AMOUNT);

	ll("Fetching current priority fee...");
	const priorityFee = await CONFIG.getPriorityFee();
	ll(`Current priority fee: ${priorityFee} SOL`);

	ll("Creating swap transaction...");
	const swapTx = await raydiumSwap.getSwapTransaction(
		CONFIG.QUOTE_MINT,
		CONFIG.TOKEN_A_AMOUNT,
		poolInfo,
		CONFIG.USE_VERSIONED_TRANSACTION,
		CONFIG.SLIPPAGE,
	);

	ll(`Using priority fee: ${priorityFee} SOL`);
	ll(
		`Transaction signed with payer: ${raydiumSwap.wallet.publicKey.toBase58()}`,
	);

	ll(`Swapping ${CONFIG.TOKEN_A_AMOUNT} SOL for BONK`);

	if (CONFIG.EXECUTE_SWAP) {
		try {
			let txid: string;
			if (CONFIG.USE_VERSIONED_TRANSACTION) {
				if (!(swapTx instanceof VersionedTransaction)) {
					throw new Error(
						"Expected a VersionedTransaction but received a different type",
					);
				}
				const latestBlockhash =
					await raydiumSwap.connection.getLatestBlockhash();
				txid = await raydiumSwap.sendVersionedTransaction(
					swapTx,
					latestBlockhash.blockhash,
					latestBlockhash.lastValidBlockHeight,
				);
			} else {
				if (!(swapTx instanceof Transaction)) {
					throw new Error(
						"Expected a Transaction but received a different type",
					);
				}
				txid = await raydiumSwap.sendLegacyTransaction(swapTx);
			}
			ll(`Transaction sent, signature: ${txid}`);
			ll(`Transaction executed: https://explorer.solana.com/tx/${txid}`);

			ll("Transaction confirmed successfully");

			// Fetch and display token balances
			const solBalance =
				(await raydiumSwap.connection.getBalance(
					raydiumSwap.wallet.publicKey,
				)) / LAMPORTS_PER_SOL;
			const bonkBalance = await getTokenBalance(raydiumSwap, CONFIG.QUOTE_MINT);

			ll("\nToken Balances After Swap:");
			ll(`SOL: ${solBalance.toFixed(6)} SOL`);
			ll(`BONK: ${bonkBalance.toFixed(2)} BONK`);
		} catch (error) {
			console.error("Error executing transaction:", error);
		}
	} else {
		ll("Simulating transaction (dry run)");
		try {
			let simulationResult: SimulatedTransactionResponse;
			if (CONFIG.USE_VERSIONED_TRANSACTION) {
				if (!(swapTx instanceof VersionedTransaction)) {
					throw new Error(
						"Expected a VersionedTransaction but received a different type",
					);
				}
				simulationResult =
					await raydiumSwap.simulateVersionedTransaction(swapTx);
			} else {
				if (!(swapTx instanceof Transaction)) {
					throw new Error(
						"Expected a Transaction but received a different type",
					);
				}
				simulationResult = await raydiumSwap.simulateLegacyTransaction(swapTx);
			}
			ll("Simulation successful");
			ll("Simulated transaction details:");
			ll(`Logs:`, simulationResult.logs);
			ll(`Units consumed:`, simulationResult.unitsConsumed);
			if (simulationResult.returnData) {
				ll(`Return data:`, simulationResult.returnData);
			}
		} catch (error) {
			console.error("Error simulating transaction:", error);
		}
	}
};
