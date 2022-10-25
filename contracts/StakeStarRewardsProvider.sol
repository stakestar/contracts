// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IRewardsProvider} from "./IRewardsProvider.sol";

contract StakeStarRewardsProvider is IRewardsProvider, Initializable, AccessControlUpgradeable {
    event ProvideRewards(int256 rewards);

    int256 public totalRewards;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function getRewards() public view returns (int256) {
        return totalRewards;
    }

    function provideRewards(int256 rewards) public onlyRole(DEFAULT_ADMIN_ROLE) {
        totalRewards = rewards;
        emit ProvideRewards(rewards);
    }
}
