// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStakeStar {

    function stake() external payable;

    function unstake(uint256 amount) external;

    function claim() external;

}
