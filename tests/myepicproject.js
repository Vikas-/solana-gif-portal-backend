const anchor = require('@project-serum/anchor');
const { SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const serumCmn = require('@project-serum/common');

const main = async () => {
  console.log('🚀 Starting test...');

  /*
   * Provider to connect to Solana nodes.
   */
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  console.log('🚀 Got and set provider...');

  /*
   * Program to interact with
   */
  const program = anchor.workspace.Myepicproject;

  console.log('🚀 Created program...');

  /*
   * Get baseAccount associated with this program?
   */
  async function getListAddress() {
    console.log('Provider wallet publicKey: ', provider.wallet.publicKey);
    console.log('program id: ', program.programId);
    let [baseAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('gifListVikas2'), provider.wallet.publicKey.toBytes()],
      program.programId
    );

    return { baseAccount, bump };
  }

  /*
   * Create a new list under this wallet?
   */
  async function newList() {
    let { baseAccount, bump } = await getListAddress();
    console.log('Got baseAccount!');

    let tx = await program.rpc.newList(bump, {
      accounts: {
        baseAccount,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    console.log('Created a new list!');

    let listData = await program.account.baseAccount.fetch(baseAccount);
    return { baseAccount, listData };
  }

  // let { listData } = await newList();

  let { baseAccount } = await getListAddress();
  let listData = await program.account.baseAccount.fetch(baseAccount);
  await program.rpc.addGif('Some Gif', {
    accounts: {
      baseAccount,
      listOwner: provider.wallet.publicKey,
      user: provider.wallet.publicKey,
    },
  });
  listData = await program.account.baseAccount.fetch(baseAccount);
  console.log('List data after adding gif: ', listData);

  await program.rpc.upvoteGif('Some Gif', {
    accounts: {
      baseAccount,
      user: provider.wallet.publicKey,
    },
  });
  listData = await program.account.baseAccount.fetch(baseAccount);
  console.log('List data after upvoting gif: ', listData);

  /*
  const baseAccount = anchor.web3.Keypair.generate();

  console.log('🚀 Generated baseAccount...');

  let tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  console.log('📝 Your transaction signature', tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count', account.totalGifs.toString());

  await program.rpc.addGif(
    'https://media3.giphy.com/media/GFI3mxEhuG6Nq/200w.webp?cid=ecf05e47b0oe8hgg1n37qusr80gj6iyao42eemj6ph5phe1w&rid=200w.webp&ct=g',
    {
      accounts: {
        baseAccount: baseAccount.publicKey,
      },
    }
  );

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count', account.totalGifs.toString());
  console.log('👀 GIF list', account.gifList);

  await program.rpc.upvoteGif(new anchor.BN(0), {
    accounts: {
      baseAccount: baseAccount.publicKey,
    },
  });

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count', account.totalGifs.toString());
  console.log('👀 GIF list', account.gifList);

  await program.rpc.sendSol(new anchor.BN(2), {
    accounts: {
      from: provider.wallet.publicKey,
      to: baseAccount.publicKey,
      systemProgram: SystemProgram.programId,
    },
  });

  const fromAccount = await getTokenAccount(
    provider,
    provider.wallet.publicKey
  );

  let fromTokenAccount = await serumCmn.getTokenAccount(
    program.provider,
    fromAccount
  );
  console.log('From token account: ', fromTokenAccount);
  */
};

async function getAccountBalance(pubkey) {
  let account = await provider.connection.getAccountInfo(pubkey);
  return account?.lamports ?? 0;
}

function expectBalance(actual, expected, message, slack = 20000) {
  expect(actual, message).within(expected - slack, expected + slack);
}

async function createUser(airdropBalance) {
  airdropBalance = airdropBalance ?? 10 * LAMPORTS_PER_SOL;
  let user = anchor.web3.Keypair.generate();
  let sig = await provider.connection.requestAirdrop(
    user.publicKey,
    airdropBalance
  );
  await provider.connection.confirmTransaction(sig);

  let wallet = new anchor.Wallet(user);
  let userProvider = new anchor.Provider(
    provider.connection,
    wallet,
    provider.opts
  );

  return {
    Key: user,
    wallet,
    provider: userProvider,
  };
}

function createUsers(numUsers) {
  let promises = [];
  for (let i = 0; i < numUsers; i++) {
    promises.push(createUser);
  }

  return Promise.all(promises);
}

function programForUser(user) {
  return new anchor.Program(
    mainProgram.idl,
    mainProgram.programId,
    user.provider
  );
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();
