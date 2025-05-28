import express from 'express'
import type { Request, Response } from 'express'
import { paymentMiddleware } from './middleware'
import { Keypair, PublicKey } from '@solana/web3.js'

const run = async () => {
    const app = express()

    app.get(
        '/protected',
        await paymentMiddleware({
            receiver: Keypair.generate().publicKey,
            amount: 1000000,
        }),
        (req: Request, res: Response) => {
            res.json({
                msg: 'success',
            })
        },
    )

    app.listen(3000)
}

run()
