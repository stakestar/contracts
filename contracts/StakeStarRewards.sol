// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakeStarRewards is AccessControl {
    bytes32 public constant STAKE_STAR_ROLE = keccak256("StakeStar");

    constructor() {
        _setupRole(STAKE_STAR_ROLE, msg.sender);
    }

    receive() external payable {}

    function pull() public onlyRole(STAKE_STAR_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
}
