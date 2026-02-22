use anchor_lang::prelude::*;

#[event]
pub struct WithdrawTokenEvent {
  pub mint: Pubkey,
  pub from: Pubkey,
  pub to: Pubkey,
  pub amount: u64,
}
