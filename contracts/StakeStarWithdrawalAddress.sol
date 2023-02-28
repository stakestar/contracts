// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakeStarWithdrawalAddress is AccessControl {
    event Pull(address indexed to, uint256 value);

    bytes32 public constant STAKE_STAR_ROLE = keccak256("StakeStar");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function pull() public payable onlyRole(STAKE_STAR_ROLE) {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
        emit Pull(msg.sender, balance);
    }
}
