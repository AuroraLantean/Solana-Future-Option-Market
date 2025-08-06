import { PublicKey } from "@solana/web3.js";

//Bun https://bun.com/docs
//Raydium API V3: https://api-v3-devnet.raydium.io/docs/#/

//Raydium Addresses on Devnet: https://docs.raydium.io/raydium/protocol/developers/addresses

//To trade tokens:
//Find Pool-info by pair

const ll = console.log;

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
