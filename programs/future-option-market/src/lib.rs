#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_spl::{
  associated_token::AssociatedToken,
  token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
//mod err;
//mod events;

declare_id!("CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp");

pub const CONFIG: &[u8; 20] = b"future_option_config";
pub const ADMINPDA: &[u8; 22] = b"future_option_adminpda";
pub const ADMINPDAATA: &[u8; 25] = b"future_option_adminpdaata";
pub const OPTIONCTRT: &[u8; 22] = b"future_option_contract";
pub const USERPAYMENT: &[u8; 26] = b"future_option_user_payment";

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

  pub fn init_config(ctx: Context<InitConfig>, pubkey: [Pubkey; 2]) -> Result<()> {
    msg!("initialize with prog_id: {:?}", ctx.program_id);
    let config = &mut ctx.accounts.config;
    config.owner = ctx.accounts.signer.key();
    config.admin = ctx.accounts.signer.key();
    //config.mint = ctx.accounts.mint.key();
    config.unique = pubkey[0];
    config.mint = ctx.accounts.mint.key();
    config.token_program = pubkey[1];
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
  pub fn init_admin_pda(ctx: Context<InitAdminPda>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin_pda = ctx.accounts.admin_pda.key();
    Ok(())
  }
  pub fn init_admin_pda_ata(ctx: Context<InitAdminPdaAta>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin_pda_ata = ctx.accounts.admin_pda_ata.key();
    Ok(())
  }
  pub fn buy_option(
    ctx: Context<BuyOption>,
    _option_id: String,
    opt_ctrt_amount: u64,
    idx: usize,
  ) -> Result<()> {
    msg!("buy_option()");
    let opt_ctrt = &mut ctx.accounts.opt_ctrt;
    let config = &mut ctx.accounts.config;
    //let time = time()?;
    let user_payment = &mut ctx.accounts.user_payment;

    let token_amount = get_premium(opt_ctrt_amount, opt_ctrt.ctrt_prices[idx])?;

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
      to: ctx.accounts.admin_pda_ata.to_account_info(),
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
    msg!("withdraw_token()");
    let decimals = ctx.accounts.mint.decimals;

    let signer_seeds: &[&[&[u8]]] = &[&[ADMINPDA.as_ref(), &[ctx.bumps.admin_pda]]];

    let cpi_accounts = TransferChecked {
      mint: ctx.accounts.mint.to_account_info(),
      from: ctx.accounts.admin_pda_ata.to_account_info(),
      to: ctx.accounts.to_ata.to_account_info(),
      authority: ctx.accounts.admin_pda.to_account_info(),
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
    idx: usize,
  ) -> Result<()> {
    msg!("sell_option()");
    let opt_ctrt = &mut ctx.accounts.opt_ctrt;
    let config = &mut ctx.accounts.config;
    //let time = time()?;
    let user_payment = &mut ctx.accounts.user_payment;

    let token_amount = get_premium(opt_ctrt_amount, opt_ctrt.ctrt_prices[idx])?;

    let new_payment = user_payment.payments[idx].checked_sub(token_amount);
    if new_payment.is_none() {
      return err!(ErrorCode::MathSubUnderflow);
    }
    user_payment.payments[idx] = new_payment.unwrap();

    let decimals = ctx.accounts.mint.decimals;

    let signer_seeds: &[&[&[u8]]] = &[&[ADMINPDA.as_ref(), &[ctx.bumps.admin_pda]]];

    let cpi_accounts = TransferChecked {
      mint: ctx.accounts.mint.to_account_info(),
      from: ctx.accounts.admin_pda_ata.to_account_info(),
      to: ctx.accounts.user_ata.to_account_info(),
      authority: ctx.accounts.admin_pda.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

    msg!("withdraw_token::transfer_checked()");
    transfer_checked(cpi_context, token_amount, decimals)?;
    Ok(())
  }
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

  #[account(mut, seeds = [ADMINPDAATA], bump, token::mint = mint, token::token_program = token_program)]
  pub admin_pda_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(mut, seeds = [USERPAYMENT, user.key().as_ref(), opt_ctrt.key().as_ref()], bump)]
  pub user_payment: Box<Account<'info, UserPayment>>,

  #[account(seeds = [ADMINPDA], bump)]
  pub admin_pda: Account<'info, AdminPda>,

  #[account(constraint = config.mint == mint.key() @ ErrorCode::TokenMintInvalid)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(constraint = config.token_program == token_program.key())]
  pub token_program: Interface<'info, TokenInterface>,
}
#[derive(Accounts)]
pub struct WithdrawToken<'info> {
  #[account(mut)] //TODO:check signer
  pub signer: Signer<'info>,

  #[account(mut, constraint = config.mint == mint.key() @ ErrorCode::TokenMintInvalid)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(seeds = [ADMINPDA], bump)]
  pub admin_pda: Account<'info, AdminPda>,

  #[account(mut, seeds = [ADMINPDAATA], bump, token::mint = mint,
		token::authority = admin_pda, token::token_program = token_program)]
  pub admin_pda_ata: InterfaceAccount<'info, TokenAccount>,

  //init_if_needed,  payer = signer,...  will make a new account, which is different from the one in the JS testing environment!
  #[account(mut, token::mint = mint, token::authority = signer, token::token_program = token_program)]
  pub to_ata: InterfaceAccount<'info, TokenAccount>,

  #[account(seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  #[account(constraint = config.token_program == token_program.key())]
  pub token_program: Interface<'info, TokenInterface>,
  pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct UserPayment {
  pub payments: [u64; LEN],
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
  #[account(mut, seeds = [ADMINPDAATA], bump, token::mint = mint, token::token_program = token_program)]
  pub admin_pda_ata: InterfaceAccount<'info, TokenAccount>,
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
pub struct InitAdminPdaAta<'info> {
  #[account(init, payer = admin,
      seeds = [ADMINPDAATA], bump, token::mint = mint,
      token::authority = admin_pda, token::token_program = token_program
		)]
  pub admin_pda_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(seeds = [ADMINPDA], bump)]
  pub admin_pda: Account<'info, AdminPda>,
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
pub struct InitAdminPda<'info> {
  #[account(init, payer = admin, seeds = [ADMINPDA], bump, space = 8 + AdminPda::INIT_SPACE )]
  pub admin_pda: Account<'info, AdminPda>,
  #[account(seeds = [CONFIG], bump, has_one = admin @ ErrorCode::OnlyAdmin)]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct AdminPda {
  pub sol_balc: u128,
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
  pub mint: InterfaceAccount<'info, Mint>,
  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
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
