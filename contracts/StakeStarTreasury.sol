// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "./interfaces/ISSVNetwork.sol";
import "./interfaces/ITWAP.sol";

contract StakeStarTreasury is Initializable, AccessControlUpgradeable {
    event SetCommission(uint24 numerator);
    event SetSlippage(uint24 numerator);
    event SetAddresses(
        address stakeStarAddress,
        address wETHAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapRouterAddress,
        address quoterAddress,
        address twapAddress,
        address poolAddress
    );
    event SetSwapParameters(uint24 poolFee, uint32 twapInterval);
    event SetRunway(uint256 minRunway, uint256 maxRunway);
    event Withdraw(uint256 amount);
    event SwapETHAndDepositSSV(uint256 ETH, uint256 SSV, uint256 depositAmount);

    uint24 public commissionNumerator;
    uint24 public slippageNumerator;
    uint24 public constant DENOMINATOR = 100_000;

    address public stakeStar;
    address public wETH;

    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;
    ISwapRouter public swapRouter;
    IQuoter public quoter;
    ITWAP public twap;

    uint256 public minRunway;
    uint256 public maxRunway;

    address public pool;
    uint24 public poolFee;
    uint32 public twapInterval;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}

    function setCommission(
        uint24 numerator
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(numerator <= DENOMINATOR, "value must be in [0, 100_000]");
        commissionNumerator = numerator;
        emit SetCommission(numerator);
    }

    function setSlippage(uint24 slippage) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(slippage <= DENOMINATOR, "value must be in [0, 100_000]");
        slippageNumerator = slippage;
        emit SetSlippage(slippage);
    }

    function setAddresses(
        address stakeStarAddress,
        address wETHAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapRouterAddress,
        address quoterAddress,
        address twapAddress,
        address poolAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        stakeStar = stakeStarAddress;
        wETH = wETHAddress;
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvTokenAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        quoter = IQuoter(quoterAddress);
        twap = ITWAP(twapAddress);
        pool = poolAddress;

        emit SetAddresses(
            stakeStarAddress,
            wETHAddress,
            ssvNetworkAddress,
            ssvTokenAddress,
            swapRouterAddress,
            quoterAddress,
            twapAddress,
            poolAddress
        );
    }

    function setSwapParameters(
        uint24 fee,
        uint32 interval
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(interval > 0, "twapInterval = 0");

        poolFee = fee;
        twapInterval = interval;

        emit SetSwapParameters(fee, interval);
    }

    function setRunway(
        uint256 minRunwayPeriod,
        uint256 maxRunwayPeriod
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(minRunwayPeriod <= maxRunwayPeriod, "minRunway > maxRunway");

        minRunway = minRunwayPeriod;
        maxRunway = maxRunwayPeriod;

        emit SetRunway(minRunwayPeriod, maxRunwayPeriod);
    }

    function withdraw(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(amount);
        emit Withdraw(amount);
    }

    function swapETHAndDepositSSV() public {
        require(minRunway != maxRunway, "runway not set");
        require(address(this).balance > 0, "no eth");
        require(slippageNumerator > 0, "slippage not set");

        uint256 balance = ssvNetwork.getAddressBalance(stakeStar);
        uint256 burnRate = ssvNetwork.getAddressBurnRate(stakeStar);

        require(
            burnRate * minRunway < balance && balance < burnRate * maxRunway,
            "not necessary to swap"
        );

        uint256 amountOut = burnRate * maxRunway - balance;
        uint256 amountIn = quoter.quoteExactOutputSingle(
            wETH,
            address(ssvToken),
            poolFee,
            amountOut,
            0
        );

        if (amountIn > address(this).balance) amountIn = address(this).balance;

        uint256 expectedPrice = twap.getPriceFromSqrtPriceX96(
            twap.getSqrtTwapX96(pool, twapInterval)
        );
        uint256 amountOutMinimum = twap.mulDiv(
            twap.mulDiv(amountIn, 1e18, expectedPrice),
            slippageNumerator,
            DENOMINATOR
        );

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: wETH,
                tokenOut: address(ssvToken),
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });
        amountOut = swapRouter.exactInputSingle{value: amountIn}(params);

        uint256 depositAmount = (ssvToken.balanceOf(address(this)) / 1e7) * 1e7;
        ssvToken.approve(address(ssvNetwork), depositAmount);
        ssvNetwork.deposit(stakeStar, depositAmount);

        emit SwapETHAndDepositSSV(amountIn, amountOut, depositAmount);
    }

    function commission(int256 amount) public view returns (uint256) {
        return
            amount > 0
                ? (uint256(amount) * commissionNumerator) / DENOMINATOR
                : 0;
    }
}
