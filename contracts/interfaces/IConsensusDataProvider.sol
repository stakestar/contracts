// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IConsensusDataProvider {
    function latestStakingBalance() external view returns (uint256 stakingBalance, uint256 timestamp);
}
