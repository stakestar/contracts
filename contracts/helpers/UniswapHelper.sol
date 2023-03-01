// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import "../interfaces/IUniswapHelper.sol";

contract UniswapHelper is IUniswapHelper {
    function getSqrtTwapX96(
        address uniswapV3Pool,
        uint32 twapInterval
    ) public view override returns (uint160 sqrtPriceX96) {
        if (twapInterval == 0) {
            (sqrtPriceX96, , , , , , ) = IUniswapV3Pool(uniswapV3Pool).slot0();
        } else {
            uint32[] memory secondsAgo = new uint32[](2);
            secondsAgo[0] = twapInterval;
            secondsAgo[1] = 0;

            (int56[] memory tickCumulative, ) = IUniswapV3Pool(uniswapV3Pool)
                .observe(secondsAgo);

            sqrtPriceX96 = TickMath.getSqrtRatioAtTick(
                int24((tickCumulative[1] - tickCumulative[0]) / twapInterval)
            );
        }
    }

    function getPriceFromSqrtPriceX96(
        uint160 sqrtPriceX96
    ) public pure override returns (uint256 price) {
        return
            FullMath.mulDiv(
                FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, FixedPoint96.Q96),
                1e18,
                FixedPoint96.Q96
            );
    }
}
