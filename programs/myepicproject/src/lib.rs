use anchor_lang::prelude::*;

declare_id!("CB2fEzdEJhrUeh4Y67rfMYNKBLHr2d3TNE896V2TbnLq");

#[program]
pub mod myepicproject {
    use super::*;
    pub fn new_list(ctx: Context<NewList>, bump: u8) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.bump = bump;
        base_account.gifs = Vec::new();
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, url: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let item = GifItem {
            url: url.to_string(),
            adder:  *ctx.accounts.user.to_account_info().key,
            votes: 0
        };
        base_account.gifs.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn upvote_gif(ctx: Context<UpvoteGif>, url: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let item = base_account
                    .gifs
                    .iter_mut()
                    .find(|item| item.url == url)
                    .ok_or(Err::NoItemFound)?;
        item.votes += 1;
        Ok(())
    }

    pub fn send_sol(ctx: Context<SendSol>, amount: u64) -> ProgramResult {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.from.key(),
            &ctx.accounts.to.key(),
            amount as u64
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.to.to_account_info(),
            ]
        )
    }
}

#[derive(Accounts)]
pub struct SendSol<'info> {
    #[account(mut)]
    from: Signer<'info>,
    #[account(mut)]
    to: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}

#[error]
pub enum Err {
    #[msg("No item with that url found")]
    NoItemFound,
}

// Attach certain variable to StartStuffOff Account
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct NewList<'info> {
    #[account(init, payer=user, seeds=[b"gifListVikas2",  user.to_account_info().key.as_ref()], bump=bump, space=9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut, seeds=[b"gifListVikas2", list_owner.to_account_info().key.as_ref()], bump=base_account.bump)]
    pub base_account: Account<'info, BaseAccount>,
    pub list_owner: UncheckedAccount<'info>,
    pub user: Signer<'info>
}

#[derive(Accounts)]
pub struct UpvoteGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    pub user: Signer<'info>
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GifItem {
    pub url: String,
    pub adder: Pubkey,
    pub votes: u64
}

#[account]
pub struct BaseAccount {
    pub bump: u8,
    pub gifs: Vec<GifItem>,
    pub total_gifs: u64,
}