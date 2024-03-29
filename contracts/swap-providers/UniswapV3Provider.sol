// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "../helpers/Utils.sol";
import "../interfaces/ISwapProvider.sol";
import "../interfaces/IUniswapHelper.sol";

contract UniswapV3Provider is
    ISwapProvider,
    Initializable,
    AccessControlUpgradeable
{
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

    uint96 public minETHLiquidity;
    // Pool fee is in hundredths of basis points
    // (e.g. the fee for a pool at the 0.3% tier is 3000; the fee for a pool at the 0.01% tier is 100).
    uint24 public poolFee;
    // in 1/100_000, e.g. 0.5% = 500
    uint24 public slippage;
    uint32 public twapInterval;

    function initialize() public initializer {
        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address swapRouterAddress,
        address quoterAddress,
        address uniswapHelperAddress,
        address wETHAddress,
        address ssvTokenAddress,
        address poolAddress
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(swapRouterAddress != address(0), Utils.ZERO_ADDR_ERROR_MSG);
        require(quoterAddress != address(0), Utils.ZERO_ADDR_ERROR_MSG);
        require(uniswapHelperAddress != address(0), Utils.ZERO_ADDR_ERROR_MSG);
        require(wETHAddress != address(0), Utils.ZERO_ADDR_ERROR_MSG);
        require(ssvTokenAddress != address(0), Utils.ZERO_ADDR_ERROR_MSG);
        require(poolAddress != address(0), Utils.ZERO_ADDR_ERROR_MSG);

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
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(interval > 0, "twapInterval = 0");
        require(numerator <= Utils.BASE, "slippage must be in [0, 100_000]");
        require(minLiquidity > 0, "minLiquidity = 0");
        require(fee <= 1_000_000, "fee must be in [0, 1_000_000]");

        poolFee = fee;
        slippage = numerator;
        twapInterval = interval;
        minETHLiquidity = uint96(minLiquidity);

        emit SetParameters(fee, numerator, interval, minLiquidity);
    }

    function swap(
        uint256 desiredAmountOut,
        uint256 deadline
    ) public payable onlyRole(Utils.TREASURY_ROLE) override returns (uint256 amountIn, uint256 amountOut)  {
        require(
            IERC20(wETH).balanceOf(pool) >= minETHLiquidity,
            "insufficient liquidity"
        );
        require(slippage > 0, "slippage not set");

        if (deadline == 0) deadline = block.timestamp;

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
            Utils.BASE
        );

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: wETH,
                tokenOut: ssvToken,
                fee: poolFee,
                recipient: msg.sender,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });
        amountOut = swapRouter.exactInputSingle{value: amountIn}(params);

        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) Utils.safeTransferETH(msg.sender, ethBalance);

        emit Swap(amountIn, amountOut);
    }
}
