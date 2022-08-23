// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IStakingPool} from "./IStakingPool.sol";
import {ReceiptToken} from "./ReceiptToken.sol";

contract StakeStar is IStakingPool, Initializable, AccessControlUpgradeable {

    ReceiptToken public receiptToken;

    function initialize() public initializer {
        receiptToken = new ReceiptToken();
        console.log("ReceiptToken is deployed:", address(receiptToken));

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        console.log("Owner is initialized:", msg.sender);
    }

    // receive ETH from msg.sender
    // mint ReceiptToken to msg.sender
    function stake() public payable {
        revert("not implemented");
    }

    // receive ReceiptToken from msg.sender
    // burn ReceiptToken
    // register unstake operation
    function unstake(uint256 amount) public {
        revert("not implemented");
    }

    // transfer ETH to msg.sender
    function claim() public {
        revert("not implemented");
    }

    // deposit ETH
    // register validator in SSV Network
    function createValidator() public {
        revert("not implemented");
    }

    // enough "free" ETH on balance
    // SSV position not liquidatable
    // TBD
    function validatorCreationAvailable() public view returns(bool) {
        return false;
    }

    // TBD
    function destroyValidator() public {
        revert("not implemented");
    }

    // TBD
    function validatorDestructionAvailable() public view returns(bool) {
        return false;
    }

    // pull rewards
    // update ReceiptToken price
    function harvest() public {
        revert("not implemented");
    }

}
