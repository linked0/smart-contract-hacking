import fs from 'fs';

import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from "chai";
import { ethers } from "hardhat";

const {
  encodeBytes32String,
  decodeBytes32String,
  id,
  getSigners,
  parseUnits,
  dataSlice,
  getBytes,
  concat,
  hexlify,
  keccak256,
  randomBytes,
  Transaction,
  toQuantity,
  toBeHex,
  toUtf8Bytes,
  zeroPadValue } = ethers;

import { CrypticRaffle, SecretDoor } from '../typechain-types';

describe('Sensitive On-Chain Data Exercise 2', () => {
  const provider = ethers.provider;
  let muggle: SignerWithAddress;

  // Original code
  const SECRET_DOOR_ABI = fs.readFileSync('./test/SecretDoorABI.json').toString();

  // Other way to load ABI
  // const rawData = fs.readFileSync('./test/SecretDoor.json', 'utf8');
  // const jsonData = JSON.parse(rawData);
  // const SECRET_DOOR_ABI = jsonData.abi;

  const SECRET_DOOR_ADDRESS = '0x148f340701D3Ff95c7aA0491f5497709861Ca27D';

  let secretDoor: SecretDoor;

  before(async () => {
    [muggle] = await getSigners();

    // Load SecretDoor Contract
    secretDoor = new ethers.Contract(SECRET_DOOR_ADDRESS, SECRET_DOOR_ABI, muggle) as unknown as SecretDoor;

    await secretDoor.unlockDoor(encodeBytes32String('EatSlugs'));
    console.log('encoded bytes: ', encodeBytes32String('EatSlugs'));
  });

  it('Exploit', async () => {
    console.log('encoded bytes: ', encodeBytes32String('Al0h0m0ra'));
    await secretDoor.unlockDoor(encodeBytes32String('Al0h0m0ra'));
  });

  after(async () => {
    console.log("secretDoor.isLocked(): ", await secretDoor.isLocked());
    expect(await secretDoor.isLocked()).equals(false);
  });
});
