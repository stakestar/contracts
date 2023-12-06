// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISwapProvider {
    function swap(
        uint256 desiredAmountOut,
        uint256 deadline
    ) external payable returns (uint256 amountIn, uint256 amountOut);
}
