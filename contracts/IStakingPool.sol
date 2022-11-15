// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStakingPool {
    function stake() external payable;

    function unstake(uint256 ssETH) external returns (uint256 unstakedEth);

    function claim() external;
}
