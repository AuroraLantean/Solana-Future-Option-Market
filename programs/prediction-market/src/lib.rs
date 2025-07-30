use anchor_lang::prelude::*;

declare_id!("CgZEcSRPh1Ay1EYR4VJPTJRYcRkTDjjZhBAjZ5M8keGp");

struct OptionContract {
  asset: String,
  kind: String, //stock, bond, exchanged traded fund
  shares: u16,  //always 100 shares of the asset
  strike_price: u128,
  expiration: u32,
  premium: u128,
}
#[program]
pub mod future_option_market {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
  }
}

#[derive(Accounts)]
pub struct Initialize {}
