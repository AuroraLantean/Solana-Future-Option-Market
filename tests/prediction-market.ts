import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import type { PredictionMarket } from "../target/types/prediction_market";

describe("prediction-market", () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.AnchorProvider.env());

	const program = anchor.workspace
		.predictionMarket as Program<PredictionMarket>;

	it("Is initialized!", async () => {
		// Add your test here.
		const tx = await program.methods.initialize().rpc();
		console.log("Your transaction signature", tx);
	});
});
