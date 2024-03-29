// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IUniswapHelper {
    function getSqrtTwapX96(
        address uniswapV3Pool,
        uint32 twapInterval
    ) external view returns (uint160 sqrtPriceX96);

    function getPriceFromSqrtPriceX96(
        uint160 sqrtPriceX96
    ) external pure returns (uint256 price);
}
