use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Payment {
    pub amount: u64,
    pub nonce: [u8; 32],
    pub payer: Pubkey,
    pub bump: u8,
}

impl Payment {
    pub const SEED_PREFIX: &'static [u8; 7] = b"payment";
}