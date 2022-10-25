// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRewardsProvider {
    function getRewards() external view returns (int256);
}
