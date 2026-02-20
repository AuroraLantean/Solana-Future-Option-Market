#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
  transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

use crate::pda::{
  Config, OptContract, Pool, SimpleAcct, UserPayment, Vault, CONFIG, LEN, OPTIONCTRT, POOL,
  SIMPLEACCT, USERPAYMENT, VAULT, VAULTATA,
};

mod pda;
//use pda::*;
//mod events;

declare_id!("CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp");

pub const OPTION_SHARES: u128 = 100;
pub const OPTION_ID_MAX_LEN: usize = 20;
pub const ASSET_NAME_MAX_LEN: usize = 20;
pub const MAXIMUM_AGE: u64 = 60; // One minute
pub const FEED_ID: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"; // SOL/USD price feed id from https://pyth.network/developers/price-feed-ids

fn time() -> Result<u32> {
  let clock = Clock::get().expect("clock time failed");
  let time = clock.unix_timestamp as u32;
  msg!("Solana time:{:?}, slot:{:?}", time, clock.slot);
  Ok(time)
}
fn get_premium(opt_ctrt_amount: u64, ctrt_price: u64) -> Result<u64> {
  let shares = opt_ctrt_amount.checked_mul(100);
  if shares.is_none() {
    return err!(ErrorCode::MathMultOverflow);
  }
  let premium = ctrt_price.checked_mul(shares.unwrap());
  if premium.is_none() {
    return err!(ErrorCode::MathMultOverflow);
  }
  Ok(premium.unwrap())
}

#[program]
pub mod future_option_market {

  use super::*;

  pub fn init_config(ctx: Context<InitConfig>, new_u64: u64) -> Result<()> {
    //pubkey: [Pubkey; 2]
    msg!("initialize with prog_id: {:?}", ctx.program_id);
    let signer = ctx.accounts.signer.key();
    msg!("signer: {:?}", signer);
    let config = &mut ctx.accounts.config;
    config.unique = signer;
    config.prog_owner = signer;
    config.admin = signer;
    config.new_u64 = new_u64;
    //config.mint = ctx.accounts.mint.key();
    //config.mint = ctx.accounts.mint.key();
    //config.token_program = pubkey[1];
    Ok(())
  }
  pub fn transfer_lamports(ctx: Context<TransferLamports>, _amt: u64) -> Result<()> {
    msg!("transfer_lamports()...");
    let _config = &mut ctx.accounts.config;
    Ok(())
  }
  pub fn time_travel(ctx: Context<Timetravel>) -> Result<()> {
    msg!("time_travel()...");
    let config = &mut ctx.accounts.config;
    let time = time()?;
    config.new_u32 = time;
    Ok(())
  }
  pub fn new_option(
    ctx: Context<NewOption>,
    option_id: String,
    asset_name: String,
    is_call_opt: bool,
    strike_prices: [u64; LEN],
    ctrt_prices: [u64; LEN],
    expiry_times: [u32; LEN],
  ) -> Result<()> {
    msg!("new_option()");
    let opt_ctrt = &mut ctx.accounts.opt_ctrt;
    let config = &mut ctx.accounts.config;
    require!(
      config.admin == *ctx.accounts.signer.key,
      ErrorCode::OnlyAdmin
    );

    let time = time()?;
    for (x, v) in expiry_times.into_iter().enumerate() {
      require!(v > time, ErrorCode::ExpiryTooSoon);
      require!(strike_prices[x] > 0, ErrorCode::StrikePriceInvalid);
      require!(ctrt_prices[x] > 0, ErrorCode::CtrtPriceInvalid);
    }
    require!(
      !option_id.is_empty() && option_id.len() <= OPTION_ID_MAX_LEN,
      ErrorCode::OptionIdInvalid
    );
    require!(
      !asset_name.is_empty() && asset_name.len() <= ASSET_NAME_MAX_LEN,
      ErrorCode::AssetNameInvalid
    );
    opt_ctrt.is_call = is_call_opt;
    opt_ctrt.asset_name = asset_name;
    opt_ctrt.strike_prices = strike_prices;
    opt_ctrt.expiry_times = expiry_times;
    opt_ctrt.ctrt_prices = ctrt_prices;
    Ok(())
  }

  pub fn init_user_payment(_ctx: Context<InitUserPayment>) -> Result<()> {
    msg!("init_user_payment()");
    //let user_payment = &mut ctx.accounts.user_payment;
    Ok(())
  }
  pub fn init_vault(ctx: Context<InitVault>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.vault = ctx.accounts.vault.key();
    Ok(())
  }
  pub fn init_vault_ata(ctx: Context<InitVaultAta>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.vault_ata = ctx.accounts.vault_ata.key();
    Ok(())
  }
  pub fn buy_option(
    ctx: Context<BuyOption>,
    _option_id: String,
    opt_ctrt_amount: u64,
    index: u32,
  ) -> Result<()> {
    msg!("buy_option()");
    let opt_ctrt = &mut ctx.accounts.opt_ctrt;
    let _config = &mut ctx.accounts.config;
    //let time = time()?;
    let user_payment = &mut ctx.accounts.user_payment;

    let idx = index as usize;
    let token_amount = get_premium(opt_ctrt_amount, opt_ctrt.ctrt_prices[idx])?;
    msg!("token_amount: {}", token_amount);

    let new_payment = user_payment.payments[idx].checked_add(token_amount);
    if new_payment.is_none() {
      return err!(ErrorCode::MathAddOverflow);
    }
    user_payment.payments[idx] = new_payment.unwrap();

    //https://www.anchor-lang.com/docs/tokens/basics/transfer-tokens
    let decimals = ctx.accounts.mint.decimals;

    let cpi_accounts = TransferChecked {
      mint: ctx.accounts.mint.to_account_info(),
      from: ctx.accounts.user_ata.to_account_info(),
      to: ctx.accounts.vault_ata.to_account_info(),
      authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    transfer_checked(cpi_context, token_amount, decimals)?;
    Ok(())
  }
  /*pub struct OptContract {
    #[max_len(20)]
    pub asset_name: String,
    pub is_call: bool,
    pub strike_prices: [u128; LEN],
    pub ctrt_prices: [u128; LEN], //ask_price, price per share to buy 1 contract, but must multiply this by 100 shares to get the premium(total cost)
    pub expiry_times: [u32; LEN],
  }
  pub struct UserPayment {
    pub payments: [u64; LEN],
  }*/

  //https://www.anchor-lang.com/docs/tokens/basics/transfer-tokens
  pub fn withdraw_token(ctx: Context<WithdrawToken>, amount: u64) -> Result<()> {
    //TODO: check signer
    msg!("withdraw tokens");
    let decimals = ctx.accounts.mint.decimals;

    let signer_seeds: &[&[&[u8]]] = &[&[VAULT.as_ref(), &[ctx.bumps.vault]]];

    let cpi_accounts = TransferChecked {
      mint: ctx.accounts.mint.to_account_info(),
      from: ctx.accounts.vault_ata.to_account_info(),
      to: ctx.accounts.to_ata.to_account_info(),
      authority: ctx.accounts.vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

    msg!("withdraw_token::transfer_checked()");
    transfer_checked(cpi_context, amount, decimals)?;
    Ok(())
  }
  pub fn sell_option(
    ctx: Context<SellOption>,
    _option_id: String,
    opt_ctrt_amount: u64,
    index: u32,
  ) -> Result<()> {
    msg!("sell_option()");
    let opt_ctrt = &mut ctx.accounts.opt_ctrt;
    let _config = &mut ctx.accounts.config;
    //let time = time()?;
    let user_payment = &mut ctx.accounts.user_payment;

    let idx = index as usize;
    let token_amount = get_premium(opt_ctrt_amount, opt_ctrt.ctrt_prices[idx])?;

    let new_payment = user_payment.payments[idx].checked_sub(token_amount);
    if new_payment.is_none() {
      return err!(ErrorCode::MathSubUnderflow);
    }
    user_payment.payments[idx] = new_payment.unwrap();

    let decimals = ctx.accounts.mint.decimals;

    let signer_seeds: &[&[&[u8]]] = &[&[VAULT.as_ref(), &[ctx.bumps.vault]]];

    let cpi_accounts = TransferChecked {
      mint: ctx.accounts.mint.to_account_info(),
      from: ctx.accounts.vault_ata.to_account_info(),
      to: ctx.accounts.user_ata.to_account_info(),
      authority: ctx.accounts.vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

    msg!("withdraw_token::transfer_checked()");
    transfer_checked(cpi_context, token_amount, decimals)?;
    Ok(())
  }

  pub fn pyth_oracle(ctx: Context<PythOracle>, feed_id: [u8; 32]) -> Result<()> {
    msg!("pyth_oracle process()");
    let price_update = &mut ctx.accounts.price_update;
    msg!("write_authority: {}", price_update.write_authority);
    /*pub enum VerificationLevel {  Partial { num_signatures: u8,},  Full,}} */
    msg!("verification_level: {:?}", price_update.verification_level);
    msg!("posted_slot: {:?}", price_update.posted_slot);

    // get_price_no_older_than will fail if the price update is more than 30 seconds old
    let maximum_age: u64 = 30;
    // get_price_no_older_than will fail if the price update is for a different price feed.
    // This string is the id of the BTC/USD feed. See https://docs.pyth.network/price-feeds/price-feeds for all available IDs.

    let price_mesg = price_update.price_message;
    msg!("feed_id: {:?}", price_mesg.feed_id);
    msg!("price: {:?}", price_mesg.price);
    msg!("conf: {:?}", price_mesg.conf);
    msg!("exponent: {:?}", price_mesg.exponent);
    msg!("publish_time: {}", price_mesg.publish_time);
    msg!("prev_publish_time: {}", price_mesg.prev_publish_time);
    /*pub struct PriceFeedMessage {
      pub feed_id: [u8; 32],
      pub price: i64,
      pub conf: u64,
      pub exponent: i32,
      pub publish_time: i64,
      pub prev_publish_time: i64,
      pub ema_price: i64,
      pub ema_conf: u64,
    } */
    //let feed_id: [u8; 32] =      get_feed_id_from_hex("0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")?;
    msg!("feed_id input: {:?}", feed_id);
    let price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;
    msg!(
      "The price is ({} ± {}) * 10^{}",
      price.price,
      price.conf, //confidence_interval
      price.exponent
    ); // (6945902311219 ± 2225688781) * 10^-8

    let asset_price = price.price as f64 * 10f64.powi(price.exponent);
    msg!("asset_price: {}", asset_price);
    Ok(())
  }
  pub fn init_simple_acct(ctx: Context<InitSimpleAccount>, price: u64) -> Result<()> {
    msg!("init_simple_acct: {:?}", ctx.program_id);
    let simple_acct = &mut ctx.accounts.simple_acct;
    simple_acct.write_authority = ctx.accounts.signer.key();
    simple_acct.price = price;
    Ok(())
  }
  pub fn flashloan_borrow(
    ctx: Context<FlashloanBorrow>,
    _option_id: String,
    token_amount: u64,
  ) -> Result<()> {
    msg!("buy_option()");
    msg!("token_amount: {}", token_amount);

    let pool = &mut ctx.accounts.pool;
    let _config = &mut ctx.accounts.config;

    //https://www.anchor-lang.com/docs/tokens/basics/transfer-tokens
    let decimals = ctx.accounts.mint.decimals;

    let cpi_accounts = TransferChecked {
      mint: ctx.accounts.mint.to_account_info(),
      from: ctx.accounts.user_ata.to_account_info(),
      to: ctx.accounts.pool_ata.to_account_info(),
      authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    transfer_checked(cpi_context, token_amount, decimals)?;
    Ok(())
  }
}
#[derive(Accounts)]
#[instruction(pool_id: String)]
pub struct FlashloanBorrow<'info> {
  #[account(mut, seeds = [POOL, config.unique.key().as_ref(), pool_id.as_bytes()], bump)]
  pub pool: Box<Account<'info, Pool>>,
  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,

  #[account(mut, token::mint = mint, token::authority = user, token::token_program = token_program)]
  pub user_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(mut, seeds = [VAULTATA], bump, token::mint = mint, token::token_program = token_program)]
  pub pool_ata: InterfaceAccount<'info, TokenAccount>,

  #[account(constraint = config.mint == mint.key() @ ErrorCode::TokenMintInvalid)]
  pub mint: InterfaceAccount<'info, Mint>,

  pub user: Signer<'info>,
  #[account(constraint = config.token_program == token_program.key())]
  pub token_program: Interface<'info, TokenInterface>,
  pub system_program: Program<'info, System>,
} //Box should only be used when you have very large structs that might cause stack overflow issues.
#[derive(Accounts)]
#[instruction()]
pub struct InitSimpleAccount<'info> {
  #[account(
        init,
        payer = signer,
        space = 8 + 40,//SimpleAcct::INIT_SPACE,
        seeds = [SIMPLEACCT],
        bump
    )]
  pub simple_acct: Account<'info, SimpleAcct>,
  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct PythOracle<'info> {
  #[account(mut)]
  pub signer: Signer<'info>,
  pub price_update: Account<'info, PriceUpdateV2>,
}
#[derive(Accounts)]
#[instruction(option_id: String)]
pub struct SellOption<'info> {
  #[account(mut)] //TODO:check signer
  pub user: Signer<'info>,

  #[account(mut, seeds = [OPTIONCTRT, config.unique.key().as_ref(), option_id.as_bytes()],bump)]
  pub opt_ctrt: Box<Account<'info, OptContract>>,
  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,

  #[account(mut, token::mint = mint, token::authority = user, token::token_program = token_program)]
  pub user_ata: InterfaceAccount<'info, TokenAccount>,

  #[account(mut, seeds = [VAULTATA], bump, token::mint = mint, token::token_program = token_program)]
  pub vault_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(mut, seeds = [USERPAYMENT, user.key().as_ref(), opt_ctrt.key().as_ref()], bump)]
  pub user_payment: Box<Account<'info, UserPayment>>,

  #[account(seeds = [VAULT], bump)]
  pub vault: Account<'info, Vault>,

  #[account(constraint = config.mint == mint.key() @ ErrorCode::TokenMintInvalid)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(constraint = config.token_program == token_program.key())]
  pub token_program: Interface<'info, TokenInterface>,
}
#[derive(Accounts)]
pub struct WithdrawToken<'info> {
  #[account(mut)]
  pub signer: Signer<'info>,

  #[account(mut, constraint = config.mint == mint.key() @ ErrorCode::TokenMintInvalid)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(seeds = [VAULT], bump)]
  pub vault: Account<'info, Vault>,

  #[account(mut, seeds = [VAULTATA], bump, token::mint = mint,
		token::authority = vault, token::token_program = token_program)]
  pub vault_ata: InterfaceAccount<'info, TokenAccount>,

  //init_if_needed,  payer = signer,...  will make a new account, which is different from the one in the JS testing environment!
  #[account(mut, token::mint = mint, token::authority = signer, token::token_program = token_program)]
  pub to_ata: InterfaceAccount<'info, TokenAccount>,

  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  #[account(constraint = config.token_program == token_program.key())]
  pub token_program: Interface<'info, TokenInterface>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(option_id: String)]
pub struct BuyOption<'info> {
  #[account(mut, seeds = [OPTIONCTRT, config.unique.key().as_ref(), option_id.as_bytes()],bump)]
  pub opt_ctrt: Box<Account<'info, OptContract>>,
  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,

  #[account(mut,token::mint = mint, token::authority = user, token::token_program = token_program)]
  pub user_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(mut, seeds = [VAULTATA], bump, token::mint = mint, token::token_program = token_program)]
  pub vault_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(mut, seeds = [USERPAYMENT, user.key().as_ref(), opt_ctrt.key().as_ref()], bump)]
  pub user_payment: Box<Account<'info, UserPayment>>,

  #[account(constraint = config.mint == mint.key() @ ErrorCode::TokenMintInvalid)]
  pub mint: InterfaceAccount<'info, Mint>,

  pub user: Signer<'info>,
  #[account(constraint = config.token_program == token_program.key())]
  pub token_program: Interface<'info, TokenInterface>,
} //Box should only be used when you have very large structs that might cause stack overflow issues.

//https://www.anchor-lang.com/docs/references/account-constraints
#[derive(Accounts)]
pub struct InitVaultAta<'info> {
  #[account(init, payer = admin,
      seeds = [VAULTATA], bump, token::mint = mint,
      token::authority = vault, token::token_program = token_program
		)]
  pub vault_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(seeds = [VAULT], bump)]
  pub vault: Account<'info, Vault>,
  #[account(constraint = config.mint == mint.key() @ ErrorCode::TokenMintInvalid)]
  pub mint: InterfaceAccount<'info, Mint>,
  #[account(seeds = [CONFIG], bump, has_one = admin @ ErrorCode::OnlyAdmin)]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub admin: Signer<'info>,
  #[account(constraint = config.token_program == token_program.key())]
  pub token_program: Interface<'info, TokenInterface>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct InitVault<'info> {
  #[account(init, payer = admin, seeds = [VAULT], bump, space = 8 + Vault::INIT_SPACE )]
  pub vault: Account<'info, Vault>,
  #[account(seeds = [CONFIG], bump, has_one = admin @ ErrorCode::OnlyAdmin)]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

/**  pub is_call: bool,
pub asset_name: String,
pub strike_prices: [u128; LEN],, //strike_price
pub price: [u128; LEN],,
pub expiry_times: [u32; LEN], */

#[derive(Accounts)]
pub struct InitUserPayment<'info> {
  #[account(init, payer = user, seeds = [USERPAYMENT, user.key().as_ref(), opt_ctrt.key().as_ref()], bump, space = 8 + UserPayment::INIT_SPACE )]
  pub user_payment: Account<'info, UserPayment>,
  #[account()] //for validation above
  pub opt_ctrt: Account<'info, OptContract>,
  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub user: Signer<'info>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
#[instruction(option_id: String)]
pub struct NewOption<'info> {
  #[account(
        init,
        payer = signer,
        space = 8 + OptContract::INIT_SPACE,
        seeds = [OPTIONCTRT, config.unique.key().as_ref(), option_id.as_bytes()],
        bump
    )]
  pub opt_ctrt: Account<'info, OptContract>,
  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
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
        payer = signer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG],
        bump
    )]
  pub config: Account<'info, Config>,
  //pub mint: InterfaceAccount<'info, Mint>,
  //pub token_program: Interface<'info, TokenInterface>,
  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
  #[msg("OnlyAdmin")]
  OnlyAdmin,
  #[msg("expiry too soon")]
  ExpiryTooSoon,
  #[msg("asset_name invalid")]
  AssetNameInvalid,
  #[msg("option_id invalid")]
  OptionIdInvalid,
  #[msg("strike price invalid")]
  StrikePriceInvalid,
  #[msg("contract price invalid")]
  CtrtPriceInvalid,
  #[msg("token mint invalid")]
  TokenMintInvalid,
  #[msg("invalid amount")]
  InvalidAmount,
  #[msg("math mult overflow")]
  MathMultOverflow,
  #[msg("math add overflow")]
  MathAddOverflow,
  #[msg("math sub underflow")]
  MathSubUnderflow,
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
