import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Votingsystemdapp } from '../target/types/votingsystemdapp'

describe('votingsystemdapp', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Votingsystemdapp as Program<Votingsystemdapp>

  const votingsystemdappKeypair = Keypair.generate()

  it('Initialize Votingsystemdapp', async () => {
    await program.methods
      .initialize()
      .accounts({
        votingsystemdapp: votingsystemdappKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([votingsystemdappKeypair])
      .rpc()

    const currentCount = await program.account.votingsystemdapp.fetch(votingsystemdappKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Votingsystemdapp', async () => {
    await program.methods.increment().accounts({ votingsystemdapp: votingsystemdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.votingsystemdapp.fetch(votingsystemdappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Votingsystemdapp Again', async () => {
    await program.methods.increment().accounts({ votingsystemdapp: votingsystemdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.votingsystemdapp.fetch(votingsystemdappKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Votingsystemdapp', async () => {
    await program.methods.decrement().accounts({ votingsystemdapp: votingsystemdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.votingsystemdapp.fetch(votingsystemdappKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set votingsystemdapp value', async () => {
    await program.methods.set(42).accounts({ votingsystemdapp: votingsystemdappKeypair.publicKey }).rpc()

    const currentCount = await program.account.votingsystemdapp.fetch(votingsystemdappKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the votingsystemdapp account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        votingsystemdapp: votingsystemdappKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.votingsystemdapp.fetchNullable(votingsystemdappKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
