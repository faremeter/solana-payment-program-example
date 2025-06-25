import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { createPaymentTransaction } from "./solana";
import { PaymentRequirements } from "./types";
import fetch from "node-fetch";
import { createPaymentHeader } from "./header";
import fs from "fs";

export const test = async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(fs.readFileSync("../../keypairs/payer.json", "utf-8")),
    ),
  );
  const url = "http://127.0.0.1:3000/protected";

  const initialResponse = await (await fetch(url)).json();
  const paymentRequirements: PaymentRequirements = {
    receiver: (initialResponse as any).address,
    amount: Number((initialResponse as any).amount),
  };

  const tx = await createPaymentTransaction(
    connection,
    paymentRequirements,
    keypair,
  );
  const header = createPaymentHeader(tx, keypair);

  const secondResponse = await (
    await fetch(url, {
      headers: {
        "X-PAYMENT": header,
      },
    })
  ).json();

  console.log(secondResponse);
};

test();
