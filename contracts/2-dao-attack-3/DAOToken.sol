// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

contract DAOToken is ERC20Snapshot, Ownable {
    uint256 public lastSnapshotId;

    constructor() ERC20("DAO Token", "DTKN") {}

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function snapshot() external returns (uint256) {
        lastSnapshotId = _snapshot();
        return lastSnapshotId;
    }

    function getBalanceAtSnapshot(
        address account,
        uint256 snapshotID
    ) external view returns (uint256) {
        return balanceOfAt(account, snapshotID);
    }

    function getTotalSupplyAtSnapshot(
        uint256 snapshotID
    ) external view returns (uint256) {
        return totalSupplyAt(snapshotID);
    }
}
