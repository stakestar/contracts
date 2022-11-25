// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakeStarRewards is AccessControl {
    event Pull(address to, uint256 amount);

    bytes32 public constant STAKE_STAR_ROLE = keccak256("StakeStar");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}

    function pull() public onlyRole(STAKE_STAR_ROLE) {
        uint256 amount = address(this).balance;

        (bool status,) = payable(msg.sender).call{value : amount}("");
        require(status, "failed to send Ether");

        emit Pull(msg.sender, amount);
    }
}
