#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

pub const LEN: usize = 7;
pub const SIMPLEACCT: &[u8; 25] = b"future_option_simple_acct";
#[account]
#[derive(InitSpace)]
pub struct SimpleAcct {
  pub write_authority: Pubkey, // 32 bytes
  pub price: u64,
  //verification_level: VerificationLevel, // 2 bytes
  //price_message: PriceFeedMessage, // 32 + 8 + 8 + 4 + 8 + 8
  //posted_slot: u64
  //#[max_len(20)]
  //pub asset_name: String,
  //pub is_call: bool,
  //pub ctrt_prices: [u64; LEN],
}

pub const USERPAYMENT: &[u8; 26] = b"future_option_user_payment";
#[account]
#[derive(InitSpace)]
pub struct UserPayment {
  pub payments: [u64; LEN],
}
pub const ADMINPDAATA: &[u8; 25] = b"future_option_adminpdaata";

pub const ADMINPDA: &[u8; 22] = b"future_option_adminpda";
#[account]
#[derive(InitSpace)]
pub struct AdminPda {
  pub sol_balc: u128,
}
pub const OPTIONCTRT: &[u8; 22] = b"future_option_contract";
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
pub const CONFIG: &[u8; 20] = b"future_option_config";
#[account]
#[derive(InitSpace)]
pub struct Config {
  pub unique: Pubkey,
  pub prog_owner: Pubkey,
  pub admin: Pubkey,
  pub admin_pda: Pubkey,
  pub admin_pda_ata: Pubkey,
  pub token_program: Pubkey,
  pub mint: Pubkey,
  pub new_u32: u32,
  pub new_u64: u64,
}
