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

Example: an option can lock in a deal of a concert event 30 days later. Then you can decide to buy the locked in ticket price or not. 

- Pro: It is a good hedge against unexpected events or bad outcome.
- Con: Highly Leveraged

- Call options: optiom to buy the asset for a strike price within the expiry date
- Sell options: optiom to sell the asset for a strike price within the expiry date

Breakeven for 1 share
- Call Options: = strike_price + option price
- Put  Options: = strike_price - option price

- Buy Call Option in a Bull Market
- Sell Put Option in a Bear Market

Scenario: an option is going to expire 5 days later with contract price $1 and strike_price $105

Exit Strategies
- Exercise Call Option(Use the option to buy the asset): 100 shares * strike price
- Sell Call Option for $107/share = contract price + strike_price + profit. Total = (Sell Price - Strike Price) * 100 shares
- Wait until the option expires, then exercise the Call Option if the asset price is > breakeven

## Operation
Market Admin opens an Option Contract with 3 possible outcomes

Users can choose an outcome and pay deposit

When the future ends, the admin has to settle the future with an outcome

Users can claim their payout

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
Transfer Tokens by Quicknode
https://www.quicknode.com/guides/solana-development/anchor/transfer-tokens

TokenInterface
https://solana.stackexchange.com/questions/4185/how-can-i-use-token-extension-token-2022-in-an-anchor-program/8175#8175
