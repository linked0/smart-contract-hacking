// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// The goal of this game is to be the 7th player to deposit 1 Ether.
// Players can deposit only 1 Ether at a time.
// Winner will be able to withdraw all Ether.

contract EtherGame {
  uint256 public targetAmount = 7 ether;
  address public winner;

  function deposit() public payable {
    require(msg.value == 1 ether, "You can only send 1 Ether");

    uint256 balance = address(this).balance;
    require(balance <= targetAmount, "Game is over");

    if (balance == targetAmount) {
      winner = msg.sender;
    }
  }

  function claimReward() public {
    require(msg.sender == winner, "Not winner");

    (bool sent, ) = msg.sender.call{value: address(this).balance}("");
    require(sent, "Failed to send Ether");
  }
}

