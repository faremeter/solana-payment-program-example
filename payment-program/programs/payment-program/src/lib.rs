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

    pub fn buy_credits(
        ctx: Context<BuyCredits>,
        amount: u64,
        nonce: [u8; 32],
        credits: u64,
    ) -> Result<()> {
        instructions::buy_credits::buy_credits_instruction(ctx, amount, nonce, credits)
    }

    pub fn consume_credits(
        ctx: Context<ConsumeCredits>,
        original_payer: Pubkey,
        purchase_nonce: [u8; 32],
        credits_to_consume: u64,
    ) -> Result<()> {
        instructions::consume_credits::consume_credits_instruction(
            ctx,
            original_payer,
            purchase_nonce,
            credits_to_consume,
        )
    }
}
