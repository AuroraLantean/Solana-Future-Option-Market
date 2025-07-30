# Solana-future-option-Market

## Installation

Install Anchor
https://www.anchor-lang.com/docs/installation

Rustc 1.88.0 (6b00bc388 2025-06-23)
Solana-cli 2.2.20 (src:dabc99a5; feat:3073396398, client:Agave)
Anchor-cli 0.31.1
Yarn 1.22.22

## future option Market - Option Contract Rule
Options: a contract that gives you the right, not obligation to buy or sell a specific quantity of an underlying asset at a predetermined price before a set date

Market Admin opens an Option Contract with 3 possible outcomes
Users can choose an outcome and pay deposit
When the future ends, the admin has to settle the future with an outcome
Users can claim their payout