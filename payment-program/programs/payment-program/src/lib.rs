use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use instructions::*;

declare_id!("DtNVgFBkqb3SSfAY6GH1HtouVcaSCaerHrE3ootDtKQV");

#[program]
pub mod payment_program {
    use super::*;

    pub fn create_payment(ctx: Context<CreatePayment>, amount: u64, nonce: [u8; 32]) -> Result<()> {
        create_payment::create_payment_instruction(ctx, amount, nonce)
    }

    pub fn settle_payment(
        ctx: Context<SettlePayment>,
        original_payer: Pubkey,
        payment_nonce: [u8; 32],
        settle_nonce: [u8; 32],
    ) -> Result<()> {
        settle_payment::settle_payment_instructions(
            ctx,
            original_payer,
            payment_nonce,
            settle_nonce,
        )
    }
}
