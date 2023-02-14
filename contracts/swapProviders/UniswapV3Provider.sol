// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "./SwapProvider.sol";
import "../interfaces/ITWAP.sol";

contract UniswapV3Provider is SwapProvider {
    event SetAddresses(
        address swapRouter,
        address quoter,
        address twap,
        address wETH,
        address ssvToken,
        address pool
    );
    event SetSwapParameters(
        uint24 poolFee,
        uint24 slippage,
        uint32 twapInterval
    );

    ISwapRouter public swapRouter;
    IQuoter public quoter;
    ITWAP public twap;

    address public wETH;
    address public ssvToken;
    address public pool;

    uint24 public poolFee;
    uint24 public slippage;
    uint32 public twapInterval;
    uint24 public constant DENOMINATOR = 100_000;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address swapRouterAddress,
        address quoterAddress,
        address twapAddress,
        address wETHAddress,
        address ssvTokenAddress,
        address poolAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        swapRouter = ISwapRouter(swapRouterAddress);
        quoter = IQuoter(quoterAddress);
        twap = ITWAP(twapAddress);
        wETH = wETHAddress;
        ssvToken = ssvTokenAddress;
        pool = poolAddress;

        emit SetAddresses(
            swapRouterAddress,
            quoterAddress,
            twapAddress,
            wETHAddress,
            ssvTokenAddress,
            poolAddress
        );
    }

    function setSwapParameters(
        uint24 fee,
        uint24 numerator,
        uint32 interval
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(interval > 0, "twapInterval = 0");
        require(numerator <= DENOMINATOR, "slippage must be in [0, 100_000]");

        poolFee = fee;
        slippage = numerator;
        twapInterval = interval;

        emit SetSwapParameters(fee, numerator, interval);
    }

    function _swap(
        uint256 desiredAmountOut
    ) internal override returns (uint256 amountIn, uint256 amountOut) {
        require(slippage > 0, "slippage not set");

        amountIn = quoter.quoteExactOutputSingle(
            wETH,
            ssvToken,
            poolFee,
            desiredAmountOut,
            0
        );

        if (amountIn > address(this).balance) amountIn = address(this).balance;

        uint256 expectedPrice = twap.getPriceFromSqrtPriceX96(
            twap.getSqrtTwapX96(pool, twapInterval)
        );
        uint256 amountOutMinimum = twap.mulDiv(
            twap.mulDiv(amountIn, 1e18, expectedPrice),
            slippage,
            DENOMINATOR
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
        if (ethBalance > 0) {
            (bool status, ) = payable(msg.sender).call{value: ethBalance}("");
            require(status, "failed to send Ether");
        }
    }
}
