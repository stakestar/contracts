// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "./SwapProvider.sol";
import "../interfaces/IUniswapHelper.sol";

contract UniswapV3Provider is SwapProvider {
    event SetAddresses(
        address swapRouter,
        address quoter,
        address uniswapHelper,
        address wETH,
        address ssvToken,
        address pool
    );
    event SetParameters(
        uint24 poolFee,
        uint24 slippage,
        uint32 twapInterval,
        uint256 minETHLiquidity
    );

    ISwapRouter public swapRouter;
    IQuoter public quoter;
    IUniswapHelper public uniswapHelper;

    address public wETH;
    address public ssvToken;
    address public pool;

    uint24 public poolFee;
    uint24 public slippage;
    uint32 public twapInterval;
    uint256 public minETHLiquidity;

    function initialize() public initializer {
        _setupRole(Constants.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address swapRouterAddress,
        address quoterAddress,
        address uniswapHelperAddress,
        address wETHAddress,
        address ssvTokenAddress,
        address poolAddress
    ) public onlyRole(Constants.DEFAULT_ADMIN_ROLE) {
        swapRouter = ISwapRouter(swapRouterAddress);
        quoter = IQuoter(quoterAddress);
        uniswapHelper = IUniswapHelper(uniswapHelperAddress);
        wETH = wETHAddress;
        ssvToken = ssvTokenAddress;
        pool = poolAddress;

        emit SetAddresses(
            swapRouterAddress,
            quoterAddress,
            uniswapHelperAddress,
            wETHAddress,
            ssvTokenAddress,
            poolAddress
        );
    }

    function setParameters(
        uint24 fee,
        uint24 numerator,
        uint32 interval,
        uint256 minLiquidity
    ) public onlyRole(Constants.DEFAULT_ADMIN_ROLE) {
        require(interval > 0, "twapInterval = 0");
        require(
            numerator <= Constants.BASE,
            "slippage must be in [0, 100_000]"
        );
        require(minLiquidity > 0, "minLiquidity = 0");

        poolFee = fee;
        slippage = numerator;
        twapInterval = interval;
        minETHLiquidity = minLiquidity;

        emit SetParameters(fee, numerator, interval, minLiquidity);
    }

    function _swap(
        uint256 desiredAmountOut
    ) internal override returns (uint256 amountIn, uint256 amountOut) {
        require(
            IERC20(wETH).balanceOf(pool) >= minETHLiquidity,
            "insufficient liquidity"
        );
        require(slippage > 0, "slippage not set");

        amountIn = quoter.quoteExactOutputSingle(
            wETH,
            ssvToken,
            poolFee,
            desiredAmountOut,
            0
        );

        if (amountIn > address(this).balance) amountIn = address(this).balance;

        uint256 expectedPrice = uniswapHelper.getPriceFromSqrtPriceX96(
            uniswapHelper.getSqrtTwapX96(pool, twapInterval)
        );
        uint256 amountOutMinimum = MathUpgradeable.mulDiv(
            MathUpgradeable.mulDiv(amountIn, 1e18, expectedPrice),
            slippage,
            Constants.BASE
        );

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: wETH,
                tokenOut: ssvToken,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });
        amountOut = swapRouter.exactInputSingle{value: amountIn}(params);

        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) payable(msg.sender).transfer(ethBalance);
    }
}