#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

pub const LEN: usize = 7;

#[account]
#[derive(InitSpace)]
pub struct SimpleAcct {
  pub price: u64,
  //#[max_len(20)]
  //pub asset_name: String,
  //pub is_call: bool,
  //pub price: u64, //strike_price
  //pub ctrt_prices: [u64; LEN],
}

#[account]
#[derive(InitSpace)]
pub struct UserPayment {
  pub payments: [u64; LEN],
}
#[account]
#[derive(InitSpace)]
pub struct AdminPda {
  pub sol_balc: u128,
}
//pub token_mint: InterfaceAccount<'info, Mint>,
#[account]
#[derive(InitSpace)]
pub struct OptContract {
  #[max_len(20)]
  pub asset_name: String,
  pub is_call: bool,
  pub strike_prices: [u64; LEN], //strike_price
  pub ctrt_prices: [u64; LEN], //ask price, price per share to buy 1 contract, but must multiply this by 100 shares to get the premium(total cost)
  pub expiry_times: [u32; LEN],
}
#[account]
#[derive(InitSpace)]
pub struct Config {
  pub unique: Pubkey,
  pub owner: Pubkey,
  pub admin: Pubkey,
  pub admin_pda: Pubkey,
  pub admin_pda_ata: Pubkey,
  pub token_program: Pubkey,
  pub balance: u128,
  pub mint: Pubkey,
  pub time: u32,
}
