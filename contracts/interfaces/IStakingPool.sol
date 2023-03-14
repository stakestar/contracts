// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStakingPool {
    function deposit() external payable;

    function stake(
        uint256 starETHAmount
    ) external returns (uint256 sstarETHAmount);

    function depositAndStake() external payable;

    function unstake(
        uint256 sstarETHAmount
    ) external returns (uint256 starETHAmount);

    function withdraw(uint256 starETHAmount) external;

    function unstakeAndWithdraw(uint256 sstarETHAmount) external;

    function claim() external;

    function localPoolWithdraw(uint256 starETHAmount) external;

    function unstakeAndLocalPoolWithdraw(uint256 sstarETHAmount) external;
}
