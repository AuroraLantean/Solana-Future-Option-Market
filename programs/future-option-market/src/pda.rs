#![allow(unexpected_cfgs)]
use anchor_lang::prelude::{borsh::BorshSchema, *};

pub const LEN: usize = 7;
pub const SIMPLEACCT: &[u8; 25] = b"future_option_simple_acct";

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, PartialEq, BorshSchema, Debug)]
pub enum VerificationLevel {
  Partial {
    #[allow(unused)]
    num_signatures: u8,
  },
  Full,
}
#[account] //#[derive(InitSpace)]
#[derive(BorshSchema)]
pub struct SimpleAcct {
  pub write_authority: Pubkey, // 32 bytes
  //pub verification_level:  VerificationLevel, // 2 bytes
  //price_message: PriceFeedMessage, // 32 + 8 + 8 + 4 + 8 + 8
  //posted_slot: u64
  pub price: u64,
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
pub const VAULTATA: &[u8; 23] = b"future_option_vault_ata";

pub const VAULT: &[u8; 19] = b"future_option_vault";
pub const POOL: &[u8; 28] = b"future_option_liquidity_pool";
#[account]
#[derive(InitSpace)]
pub struct Pool {
  #[max_len(20)]
  pub asset_name: String,
}
#[account]
#[derive(InitSpace)]
pub struct Vault {
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
  pub vault: Pubkey,
  pub vault_ata: Pubkey,
  pub token_program: Pubkey,
  pub mint: Pubkey,
  pub new_u32: u32,
  pub new_u64: u64,
}
