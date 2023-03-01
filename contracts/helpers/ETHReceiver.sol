// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Constants.sol";

contract ETHReceiver is AccessControl {
    event Pull(address indexed to, uint256 value);

    receive() external payable {}

    constructor() {
        _setupRole(Constants.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function pull()
        public
        payable
        onlyRole(Constants.STAKE_STAR_ROLE)
        returns (uint256 balance)
    {
        balance = address(this).balance;
        payable(msg.sender).transfer(balance);
        emit Pull(msg.sender, balance);
    }
}
