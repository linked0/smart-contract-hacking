# smart-contract-hacking

This is a comprehensive summary of various smart contract hacking techniques and codes, intended to serve as a detailed resource for those interested in understanding and exploiting vulnerabilities within smart contracts. This repository aims to provide an extensive range of examples and in-depth explanations to enhance knowledge and practical skills in the field of blockchain security.

## setup and test

### install
```
nvm use 18
yarn
```

### build & test
```
cp .env.sample .env
yarn build
yarn test
```

### test for DOS Attacks Exercise 1
It takes so so long time to test the DOS Attacks Exercise 1 that is located in `test/longer/3-dos-1.ts`. So you should test the exercise only and use 'yarn test:longer'.


## Details of hacking exercises

### Unchecked Returns Exercise 1 (`test/5-unchecked-return-1.ts`)
#### Hacking Point
1. The low level calls like `send`, `call`, `delegatecall`, and `staticcall` don't revert.
2. If you don't check return value in sending ETHs, you can lose the money.
3. This is the bad pattern.
```
payable(_to).send(_amount);
```
or
```
payable(donation.to).call{value: msg.value}("");
```
#### Solution
```
(bool success, ) = payable(donation.to).call{value: msg.value}("");
require(success, "donation failed, couldn't send ETH");
```
