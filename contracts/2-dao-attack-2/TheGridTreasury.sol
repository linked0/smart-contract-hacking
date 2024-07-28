// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Address.sol";

contract TheGridTreasury {

    using Address for address payable;
    address public governance;

    event PaymentSent(address indexed receiver, uint256 amount);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }

    constructor(address _governance) {
        governance = _governance;
    }

    function sendPayment(address _receiver, uint _amount) external onlyGovernance {
        payable(_receiver).sendValue(_amount);
        emit PaymentSent(_receiver, _amount);
    }

    receive() external payable {}
    
}
