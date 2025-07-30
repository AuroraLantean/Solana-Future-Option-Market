#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp");

pub const CONFIG: &[u8; 27] = b"future_option_market_config";

fn time() -> Result<u32> {
  let clock = Clock::get().expect("clock time failed");
  let time = clock.unix_timestamp as u32;
  msg!("Solana time:{:?}, slot:{:?}", time, clock.slot);
  Ok(time)
}

#[account]
#[derive(InitSpace)]
struct OptionContract {
  //asset: String,
  //kind: String, //stock, bond, exchanged traded fund
  shares: u16, //always 100 shares of the asset
  strike_price: u128,
  expiration: u32,
  premium: u128,
}
#[program]
pub mod future_option_market {
  use super::*;

  pub fn initialize(ctx: Context<InitConfig>) -> Result<()> {
    msg!("initialize with prog_id: {:?}", ctx.program_id);
    let config = &mut ctx.accounts.config;
    config.owner = ctx.accounts.auth.key();
    Ok(())
  }
}

//The discriminator is the first 8 bytes of the SHA256 hash of the string account:<AccountName>. This discriminator is stored as the first 8 bytes of account data when an account is created.
#[derive(Accounts)]
pub struct InitConfig<'info> {
  #[account(
        init,
        payer = auth,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG],
        bump
    )]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub auth: Signer<'info>,
  pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct Config {
  pub owner: Pubkey,
  pub balance: u64,
}
