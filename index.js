
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
const secret = JSON.parse(process.env.SENDER_PRIVATE_KEY);
const sender = Keypair.fromSecretKey(new Uint8Array(secret));
const tokenAddress = new PublicKey(process.env.TOKEN_ADDRESS);

const { createTransferInstruction, getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

app.post('/api/babe-solana-airdrop', async (req, res) => {
  const { address } = req.body;

  try {
    const recipient = new PublicKey(address);
    const fromTokenAccount = await getAssociatedTokenAddress(tokenAddress, sender.publicKey);
    const toTokenAccount = await getAssociatedTokenAddress(tokenAddress, recipient);

    await getAccount(connection, toTokenAccount).catch(() => {
      throw new Error('目标账户未初始化，暂无法空投');
    });

    const tx = new Transaction().add(
      createTransferInstruction(fromTokenAccount, toTokenAccount, sender.publicKey, 10000000)
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [sender]);
    res.json({ success: true, txHash: signature });

  } catch (e) {
    console.error("空投失败：", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/', (req, res) => {
  res.send("BABE Airdrop Backend Running.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`BABE Airdrop API running on port ${port}`));
