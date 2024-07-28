// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract UnrestrictedOwner {

  address public owner;

  constructor() {
    owner = msg.sender;
  }

  function changeOwner(address _newOwner) public {
    owner = _newOwner;
  }
}

