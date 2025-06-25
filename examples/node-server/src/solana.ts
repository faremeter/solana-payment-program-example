import {
  clusterApiUrl,
  Keypair,
  MessageV0,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { CreatePaymentArgs, PaymentRequirements } from "./types";
import idl from "../payment_program.json";
import {
  AnchorProvider,
  BN,
  BorshCoder,
  Program,
  Wallet,
} from "@coral-xyz/anchor";
import { PaymentProgram } from "./idl_type";

import paymentProgramInfo from "../payment_program.json" assert { type: "json" };

export const coder = new BorshCoder(idl as PaymentProgram);

const connection = new Connection(clusterApiUrl("devnet"));

const dummyKeypair = Keypair.generate();
const wallet = new Wallet(dummyKeypair);

const provider = new AnchorProvider(
  connection,
  wallet,
  AnchorProvider.defaultOptions(),
);

export const program = new Program(idl as PaymentProgram, provider);

export const processTransaction = async (
  connection: Connection,
  signedTransaction: VersionedTransaction,
): Promise<string | null> => {
  try {
    const signature = await connection.sendTransaction(signedTransaction);
    const { value } = await connection.confirmTransaction(
      signature,
      "confirmed",
    );

    return value.err ? null : signature;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const isValidTransferTransaction = async (
  connection: Connection,
  signature: TransactionSignature,
): Promise<boolean> => {
  const transaction = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!transaction || transaction.meta?.err) {
    return false;
  }

  const transferIndex =
    transaction.transaction.message.compiledInstructions.findIndex(
      (instruction) => {
        const programId =
          transaction.transaction.message.staticAccountKeys[
            instruction.programIdIndex
          ];
        return programId.equals(new PublicKey(paymentProgramInfo.address));
      },
    );

  return transferIndex !== -1;
};

export const extractTransferData = async (
  connection: Connection,
  signature: TransactionSignature,
): Promise<
  | {
      success: true;
      payer: PublicKey;
      data: CreatePaymentArgs;
    }
  | {
      success: false;
      err: string;
    }
> => {
  const transaction = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!transaction || transaction.meta?.err) {
    return {
      success: false,
      err: "Transaction not successfully landed",
    };
  }

  const transferIndex =
    transaction.transaction.message.compiledInstructions.findIndex(
      (instruction) => {
        const programId =
          transaction.transaction.message.staticAccountKeys[
            instruction.programIdIndex
          ];
        return programId.equals(new PublicKey(paymentProgramInfo.address));
      },
    );

  if (transferIndex === -1) {
    return {
      success: false,
      err: "Transaction does not contain transfer instruction",
    };
  }

  const payer =
    transaction.transaction.message.staticAccountKeys[
      transaction.transaction.message.compiledInstructions[transferIndex]
        .accountKeyIndexes[0]
    ];

  const transferData =
    transaction.transaction.message.compiledInstructions[transferIndex].data;
  const decoded = coder.instruction.decode(Buffer.from(transferData));

  if (!decoded) {
    return {
      success: false,
      err: "Unable to decode data",
    };
  }

  const typedData = decoded.data as CreatePaymentArgs;

  return {
    success: true,
    payer,
    data: typedData,
  };
};

export const createPaymentTransaction = async (
  connection: Connection,
  paymentRequirements: PaymentRequirements,
  payer: Keypair,
): Promise<VersionedTransaction> => {
  const nonce = crypto.getRandomValues(new Uint8Array(32));

  const [paymentAccount, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("payment"), nonce, payer.publicKey.toBuffer()],
    program.programId,
  );

  const ixs = [];

  const programInstruction = await program.methods
    .createPayment(new BN(paymentRequirements.amount), Array.from(nonce))
    .accountsStrict({
      payer: payer.publicKey,
      receiver: paymentRequirements.receiver,
      payment: paymentAccount,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  ixs.push(programInstruction);

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const message = new TransactionMessage({
    instructions: ixs,
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  tx.sign([payer]);

  return tx;
};

export const createSettleTransaction = async (
  connection: Connection,
  settleAuthority: Keypair,
  payer: PublicKey,
  paymentNonce: number[],
): Promise<VersionedTransaction | null> => {
  if (paymentNonce.length !== 32) {
    return null;
  }

  console.log("Creating settle tx");

  const settleNonce = crypto.getRandomValues(new Uint8Array(32));

  const [paymentAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("payment"), Buffer.from(paymentNonce), payer.toBuffer()],
    program.programId,
  );

  const ixs = [];

  const programInstruction = await program.methods
    .settlePayment(payer, paymentNonce, Array.from(settleNonce))
    .accountsStrict({
      admin: settleAuthority.publicKey,
      payment: paymentAccount,
      originalPayerAccount: payer,
    })
    .instruction();

  ixs.push(programInstruction);

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const message = new TransactionMessage({
    instructions: ixs,
    payerKey: settleAuthority.publicKey,
    recentBlockhash: blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  tx.sign([settleAuthority]);

  return tx;
};

export const settleTransaction = async (
  conneciton: Connection,
  tx: VersionedTransaction,
): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      err: string;
    }
> => {
  const signature = await processTransaction(conneciton, tx);
  console.log("Settle signature", signature);

  if (!signature) {
    return {
      success: false,
      err: "Unable to proccess settlement tx",
    };
  }

  return {
    success: true,
  };
};
