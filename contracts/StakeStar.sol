// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IStakeStar} from "./IStakeStar.sol";
import {ReceiptToken} from "./ReceiptToken.sol";

contract StakeStar is IStakeStar, Initializable, AccessControlUpgradeable {

    ReceiptToken public receiptToken;

    function initialize() public initializer {
        receiptToken = new ReceiptToken();
        console.log("ReceiptToken is deployed:", address(receiptToken));

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        console.log("Owner is initialized:", msg.sender);
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
