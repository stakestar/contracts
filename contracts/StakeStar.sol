// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IStakeStar} from "./IStakeStar.sol";

contract StakeStar is IStakeStar, Initializable, AccessControlUpgradeable {

    function initialize() public initializer {
        console.log("Initializing owner", msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // receive eth from msg.sender
    // mint shares to msg.sender
    function stake() public payable {
        revert("not implemented");
    }

    // receive ERC20 shares from msg.sender
    // burn shares
    // register unstake operation
    function unstake(uint256 amount) public {
        revert("not implemented");
    }

    // transfer eth to msg.sender
    function claim() public {
        revert("not implemented");
    }

}
