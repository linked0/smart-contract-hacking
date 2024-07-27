import fs from 'fs';

import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from "chai";
import { formatBytes32String } from 'ethers-v5/lib/utils';
import { ethers } from "hardhat";

import { CrypticRaffle, SecretDoor } from '../typechain-types';


const { deployContract, getSigners, encodeBytes32String, parseEther, formatUnits } = ethers;

describe('Sensitive On-Chain Data Exercise 2', () => {
  const provider = ethers.provider;
  let muggle: SignerWithAddress;

  // Original code
  // const SECRET_DOOR_ABI = fs.readFileSync('./test/zhacking/SecretDoor.json').toString();

  const rawData = fs.readFileSync('./test/zhacking/SecretDoor.json', 'utf8');
  const jsonData = JSON.parse(rawData);
  const SECRET_DOOR_ABI = jsonData.abi;
  const SECRET_DOOR_ADDRESS = '0x148f340701D3Ff95c7aA0491f5497709861Ca27D';

  let secretDoor: SecretDoor;

  before(async () => {
    [muggle] = await getSigners();

    // Load SecretDoor Contract
    secretDoor = new ethers.Contract(SECRET_DOOR_ADDRESS, SECRET_DOOR_ABI, muggle) as unknown as SecretDoor;

    await secretDoor.unlockDoor(encodeBytes32String('EatSlugs'));
    expect(await secretDoor.isLocked()).equals(true);
    console.log('encoded bytes: ', encodeBytes32String('EatSlugs'));
  });

  it('Exploit', async () => {
    console.log('encoded bytes: ', encodeBytes32String('Al0h0m0ra'));
    await secretDoor.unlockDoor(formatBytes32String('Al0h0m0ra'));
  });

  after(async () => {
    expect(await secretDoor.isLocked()).equals(false);
  });
});
