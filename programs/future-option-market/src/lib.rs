#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

mod err;
//mod events;

declare_id!("CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp");

pub const CONFIG: &[u8; 27] = b"future_option_market_config";
pub const OPTION_SHARES: u128 = 100;

fn time() -> Result<u32> {
  let clock = Clock::get().expect("clock time failed");
  let time = clock.unix_timestamp as u32;
  msg!("Solana time:{:?}, slot:{:?}", time, clock.slot);
  Ok(time)
}

#[account]
#[derive(InitSpace)]
pub struct OptionContract {
  pub is_call: bool,
  #[max_len(20)]
  pub asset: String,
  pub strike: u128, //strike_price
  pub expiry: u32,
  pub price: u128, //ask price, price per share to buy 1 contract, but must multiply this by 100 shares to get the premium(total cost)
}
#[program]
pub mod future_option_market {
  use super::*;
  use ErrorCode::*;

  pub fn initialize(ctx: Context<InitConfig>) -> Result<()> {
    msg!("initialize with prog_id: {:?}", ctx.program_id);
    let config = &mut ctx.accounts.config;
    config.owner = ctx.accounts.auth.key();
    Ok(())
  }
  pub fn transfer_lamports(ctx: Context<TransferLamports>, amt: u64) -> Result<()> {
    msg!("transfer_lamports()...");
    let config = &mut ctx.accounts.config;
    let time = time()?;
    Ok(())
  }
  pub fn time_travel(ctx: Context<Timetravel>) -> Result<()> {
    msg!("time_travel()...");
    let config = &mut ctx.accounts.config;
    let time = time()?;
    config.time = time;
    Ok(())
  }
}
#[derive(Accounts)]
pub struct TransferLamports<'info> {
  #[account(mut, seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  //pub mint: InterfaceAccount<'info, Mint>,
  //pub token_acct: Account<'info, TokenAccount>,
  pub from: Signer<'info>,
  #[account(mut)]
  /// CHECK:
  pub to: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Timetravel<'info> {
  #[account(mut, seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  pub from: Signer<'info>,
  pub system_program: Program<'info, System>,
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
  pub time: u32,
}

/*TODO: realloc
https://solana.com/developers/courses/onchain-development/anchor-pdas
https://www.quicknode.com/guides/solana-development/anchor/how-to-use-constraints-in-anchor
#[account(
    mut,
    seeds = [signer.key().as_ref()],
    bump,
    realloc = data.get_size(),
    realloc::payer = signer,
    realloc::zero = false
)]
pub data: Account<'info, DataAccount>*/
