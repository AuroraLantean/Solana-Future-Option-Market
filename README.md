# Solana-future-option-Market

## Installation

Install Anchor
https://www.anchor-lang.com/docs/installation
```
Rustc 1.88.0 (6b00bc388 2025-06-23)
Solana-cli 2.2.20 (src:dabc99a5; feat:3073396398, client:Agave)
Anchor-cli 0.31.1
Yarn 1.22.22
Bun v1.2.19
```

## Setup
Setup Biome
https://biomejs.dev/guides/getting-started/

Install TypeScript declarations for BunJs
https://bun.sh/guides/runtime/typescript

Due to current Anchor depending on Solana JavaScript SDK (v1.x), I will keep using this for making frontend integration, until Anchor updates their code to Solana/kit
https://github.com/solana-foundation/solana-web3.js/tree/maintenance/v1.x

## Future Option Market
- Call Options are contracts that give you the right, not obligation to buy a specific quantity of an underlying asset at a predetermined price before the expiry date

- Put Options are contracts that give you the right, not obligation to sell a specific quantity of an underlying asset at a predetermined price before the expiry date

1 option contract is always worth 100 shares of the underlying asset

Example: an option can lock you in a future concert ticket schuduled 30 days later. Then you can choose to buy the ticket at the strike price. 

- Call options: option to buy the asset for a strike price within the expiry date
- Sell options: option to sell the asset for a strike price within the expiry date

Breakeven for 1 share
- Call Options: = strike_price + option price
- Put  Options: = strike_price - option price

- Buy Call Option in a Bull Market
- Sell Put Option in a Bear Market

Scenario: an option is going to expire 5 days later with contract price $1 and strike_price $105

### Exit Strategies
- Exercise Call Option(Use the option to buy the asset): 100 shares * strike price
- Sell Call Option for $107/share = contract price + strike_price + profit. Total = (Sell Price - Strike Price) * 100 shares
- Wait until the option expires, then exercise the Call Option if the asset price is > breakeven

### Currency Pairs
Example: In the EUR/USD pair, if the exchange rate is 1.2000, it means that one euro is worth 1.2000 US dollars. In this case, the euro is the base currency, and the US dollar is the quote currency. 

## Operation
Market Admin opens an Option Contract with 3 possible outcomes

Users can choose an outcome and pay deposit

When the future ends, the admin has to settle the future with an outcome

Users can claim their payout

## Generate and Mint Tokens
## Launch Tokens
### Make Twitter/Telegram/Website

### Concept
Search in Dextools.io to see if the token name already exists

### Find/Generate Token
- Find token addresses at official token website, Dex platforms like https://dexscreener.com/, or  Verified token lists from Jupiter

- Generate a new token
Make decimals = 6, square image, supply = 1B

Websites to launch new tokens:
- OrionTools.io
- Orca Wavebreak https://www.orca.so/tokens/launch
- Raydium Launchpad https://raydium.io/launchpad/

Make a token image
https://deepai.org/machine-learning-model/fantasy-world-generator

Upload the image to a cloud service like https://app.pinata.cloud/

### Revoke Token Authorities
Revoke Freeze for a liquidity pool
Revoke Mint for legitimate tokens

https://tools.smithii.io/revoke-freeze/solana


### Add Liquidity Pool
https://docs.raydium.io/raydium/protocol/developers/addresses

- Raydium Website > Crate Pool: paste your Raydium market id. https://raydium.io/liquidity-pools/

- Smithii
https://tools.smithii.io/liquidity-pool/solana

https://www.youtube.com/watch?v=7bNRzAq9Pjs&list=PLFjyohaQTrofpQtldTBzVsCdTruIn0OlL&index=3

If you lose your LP NFT, you lose access to the liquidity

Liquidity Types
- Concentrated Liquidity CLMM with risk of prices moving out side of expected range, and ending up with only one token in your pool => no exchange fee
- AMM v4

Base token amount(in your new token) = >95% of total supply for anonimous token owners

Quote token amount(in SOL) = the above base token amount worth in SOL. like 10 SOL

Remove liquidity from a pool: at DexScreener.com/your token, copy Pair address(pool address). Go to Remove Liqudity and ender your pool address

### Burn Liquidity Pool Tokens(LP Tokens)
Burn LP tokens to lock the liquidity pool so other people know you cannot pull those tokens and quote tokens out.
Also see sol-incinerator.com

### Update DexTools.io and DexScreener.com

### Manage Community

### Marketing

### Make a Trading Bot with Jupiter Metis Swap API
Login to Quicknode and go to Marketplace, buy Metis Jupiter Swap API
https://www.quicknode.com/guides/solana-development/3rd-party-integrations/jupiter-api-trading-bot

Or use the public API at https://www.jupiterapi.com/?utm_source=guides-jup-trading-bot


## Error
### anchor test not wait for solana-test-validator #3624
https://github.com/solana-foundation/anchor/issues/3624
use Yarn to run tests

### no method named `file` found for reference `&proc_macro::Span` in the current scope
use the dependency versions above

### failed to start faucet: Unable to bind faucet to 0.0.0.0:9900, check the address is not already in use: Address already in use (os error 98)
```
lsof -i :9900
kill -9 <process id>
```

### command not found: node
See https://solana.stackexchange.com/questions/1648/error-no-such-file-or-directory-os-error-2-error-from-anchor-test/16564#16564

## References
Transfer Tokens from/to PDA-ATA
Anchor Docs: https://www.anchor-lang.com/docs/tokens/basics/transfer-tokens

TransferChecked: https://docs.rs/anchor-spl/latest/anchor_spl/token/struct.TransferChecked.html#

https://solana.stackexchange.com/questions/9944/need-some-guide-or-snippet-demo-to-transfer-spl-token-out-from-programs-pda-ac/9950#9950

https://solana.stackexchange.com/questions/15390/transfer-tokens-to-and-from-a-program
https://solana.stackexchange.com/questions/380/what-is-the-difference-between-transfer-and-transferchecked-instruction-from-the?rq=1
    

    
Transfer Tokens by Quicknode
https://www.quicknode.com/guides/solana-development/anchor/transfer-tokens

TokenInterface
https://solana.stackexchange.com/questions/4185/how-can-i-use-token-extension-token-2022-in-an-anchor-program/8175#8175
