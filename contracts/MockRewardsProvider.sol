// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IRewardsProvider} from "./IRewardsProvider.sol";

contract MockRewardsProvider {
    event ProvideRewards(int256 rewards);

    int256 public totalRewards;

    function getRewards() public view returns (int256) {
        return totalRewards;
    }

    function provideRewards(int256 rewards) public {
        totalRewards = rewards;
        emit ProvideRewards(rewards);
    }
}
