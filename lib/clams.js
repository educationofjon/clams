'use strict';

const assert = require('bsert');
const FullNode = require('bcoin/lib/node/fullnode');
const TX = require('bcoin/lib/primitives/tx');
const Script = require('bcoin/lib/script/script');
const Outpoint = require('bcoin/lib/primitives/outpoint');
const Output = require('bcoin/lib/primitives/output');
const Input = require('bcoin/lib/primitives/input');
const {NodeClient, WalletClient} = require('bclient');


/*
 * Constants
 */

const redeem = new Script();
const script = Script.fromScripthash(redeem.hash160());

const node = new FullNode({
  network: 'regtest',
  db: 'memory',
  prefix: '/home/rojikku/.bcoin',
  apiKey: 'sawayama',
  workers: true,
  env: true,
  logConsole: true,
  logLevel: 'debug',
  plugins: [require('bcoin/lib/wallet/plugin')]
});

const wdb = node.require('walletdb');

const nclient = new NodeClient({
  port: node.network.rpcPort,
  apiKey: 'sawayama'
});

const wclient = new WalletClient({
  port: node.network.walletPort,
  apiKey: 'sawayama'
});


/*
 * Helpers
 */

function createTransaction(op) {
  const tx = new TX();
  const input = Input.fromOutpoint(op);

  input.script.pushInt(1);
  input.script.pushData(script.toRaw());
  input.script.compile();

  tx.inputs.push(input);

  for (let i = 0; i < 1; i++) {
    const output = new Output();
    output.script.inject(script);
    tx.outputs.push(output);
  }

  tx.refresh();

  return tx;
}


(async () => {
  await node.open();
  await nclient.open();
  await wclient.open();

  let funds = null;
  let wallet = null;

  wallet = await wclient.createWallet('bitfish');


  for (let i = 0; i < 10; i++) {
    const job = await node.miner.cpu.createJob();
    const block = await job.mineAsync();
    await node.chain.add(block);
    funds = block.txs[0];
  }

  // Fund ourselves
  node.logger.info('Creating Outputs..');

  const tx = new TX();
  const input = Input.fromTX(funds, 0);
  input.script.pushInt(1);
  input.script.pushData(redeem.toRaw());
  input.script.compile();

  tx.inputs.push(input);

  for (let i = 0; i < 10; i++) {
    const output = new Output();
    output.script.inject(script);
    tx.outputs.push(output);
  }

  tx.refresh();
})().catch((err) => {
  console.log(err.stack);
});
