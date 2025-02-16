// SPDX-License-Identifier MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GoldToken
 * @author Jay Lee
 */
contract GoldToken is ERC20, Ownable {
  constructor() ERC20("Gold Token", "GLD") {}

  function mint(address _to, uint _amount) external onlyOwner {
    _mint(_to, _amount);
  }

  function burn(address _account, uint _amount) external onlyOwner {
    _burn(_account, _amount);
  }
}
