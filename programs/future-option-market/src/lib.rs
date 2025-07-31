#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

//mod err;
//mod events;

declare_id!("CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp");

pub const CONFIG: &[u8; 20] = b"future_option_config";
pub const OPTIONCONTRACT: &[u8; 22] = b"future_option_contract";
pub const OPTION_SHARES: u128 = 100;
pub const OPTION_ID_MAX_LEN: usize = 20;
pub const ASSET_NAME_MAX_LEN: usize = 20;
pub const LEN: usize = 7;

fn time() -> Result<u32> {
  let clock = Clock::get().expect("clock time failed");
  let time = clock.unix_timestamp as u32;
  msg!("Solana time:{:?}, slot:{:?}", time, clock.slot);
  Ok(time)
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
  pub fn new_option(
    ctx: Context<NewOption>,
    option_id: String,
    asset_name: String,
    is_call_opt: bool,
    strike_prices: [u128; LEN],
    ctrt_prices: [u128; LEN],
    expiry_times: [u32; LEN],
  ) -> Result<()> {
    msg!("new_option()");
    let optcontract = &mut ctx.accounts.optcontract;
    //let config = &mut ctx.accounts.config;
    let time = time()?;
    for (idx, v) in expiry_times.into_iter().enumerate() {
      require!(v > time, ErrorCode::ExpiryTooSoon);
      require!(strike_prices[idx] > 0, ErrorCode::StrikePriceInvalid);
      require!(ctrt_prices[idx] > 0, ErrorCode::CtrtPriceInvalid);
    }
    require!(
      !option_id.is_empty() && option_id.len() <= OPTION_ID_MAX_LEN,
      ErrorCode::OptionIdInvalid
    );
    require!(
      !asset_name.is_empty() && asset_name.len() <= ASSET_NAME_MAX_LEN,
      ErrorCode::RoomAssetInvalid
    );
    optcontract.is_call = is_call_opt;
    optcontract.asset_name = asset_name;
    optcontract.strike_prices = strike_prices;
    optcontract.expiry_times = expiry_times;
    optcontract.ctrt_prices = ctrt_prices;
    Ok(())
  }
}
/**  pub is_call: bool,
pub asset_name: String,
pub strike_prices: u128, //strike_price
pub price: u128,
pub expiry_times: u32, */
#[derive(Accounts)]
#[instruction(option_id: String)]
pub struct NewOption<'info> {
  #[account(
        init,
        payer = signer,
        space = 8 + OptContract::INIT_SPACE,
        seeds = [OPTIONCONTRACT, signer.key().as_ref(), option_id.as_bytes()],
        bump
    )]
  pub optcontract: Account<'info, OptContract>,
  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
}
//pub token_mint: InterfaceAccount<'info, Mint>,
#[account]
#[derive(InitSpace)]
pub struct OptContract {
  #[max_len(20)]
  pub asset_name: String,
  pub is_call: bool,
  pub strike_prices: [u128; LEN], //strike_price
  pub ctrt_prices: [u128; LEN], //ask price, price per share to buy 1 contract, but must multiply this by 100 shares to get the premium(total cost)
  pub expiry_times: [u32; LEN],
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
  pub balance: u128,
  pub time: u32,
}

#[error_code]
pub enum ErrorCode {
  #[msg("unauthorized")]
  Unauthorized,
  #[msg("expiry too soon")]
  ExpiryTooSoon,
  #[msg("asset_name invalid")]
  RoomAssetInvalid,
  #[msg("option_id invalid")]
  OptionIdInvalid,
  #[msg("strike price invalid")]
  StrikePriceInvalid,
  #[msg("contract price invalid")]
  CtrtPriceInvalid,
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
