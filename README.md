# Solana-future-option-Market

## Installation

Install Anchor
https://www.anchor-lang.com/docs/installation

Rustc 1.88.0 (6b00bc388 2025-06-23)
Solana-cli 2.2.20 (src:dabc99a5; feat:3073396398, client:Agave)
Anchor-cli 0.31.1
Yarn 1.22.22
Bun v1.2.19

## Setup
Setup Biome
https://biomejs.dev/guides/getting-started/


## future option Market - Option Contract Rule
Options: a contract that gives you the right, not obligation to buy or sell a specific quantity of an underlying asset at a predetermined price before a set date

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
