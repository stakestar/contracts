// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "./interfaces/ISSVNetwork.sol";

contract StakeStarTreasury is Initializable, AccessControlUpgradeable {
    event SetCommission(uint256 numerator);
    event SetAddresses(
        address stakeStarAddress,
        address wETHAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapRouterAddress,
        address quoterAddress
    );
    event SetFee(uint256 poolFee);
    event SetRunway(uint256 minRunway, uint256 maxRunway);
    event Withdraw(uint256 amount);
    event SwapETHAndDepositSSV(uint256 ETH, uint256 SSV, uint256 depositAmount);

    uint256 public commissionNumerator;
    uint256 public constant COMMISSION_DENOMINATOR = 100_000;

    address public stakeStar;
    address public wETH;

    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;
    ISwapRouter public swapRouter;
    IQuoter public quoter;

    uint256 public minRunway;
    uint256 public maxRunway;

    uint24 public fee;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}

    function setCommission(
        uint256 numerator
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            numerator <= COMMISSION_DENOMINATOR,
            "value must be in [0, 100_000]"
        );
        commissionNumerator = numerator;
        emit SetCommission(numerator);
    }

    function setAddresses(
        address stakeStarAddress,
        address wETHAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapRouterAddress,
        address quoterAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        stakeStar = stakeStarAddress;
        wETH = wETHAddress;
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvTokenAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        quoter = IQuoter(quoterAddress);

        emit SetAddresses(
            stakeStarAddress,
            wETHAddress,
            ssvNetworkAddress,
            ssvTokenAddress,
            swapRouterAddress,
            quoterAddress
        );
    }

    function setFee(uint24 poolFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        fee = poolFee;

        emit SetFee(poolFee);
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

        uint256 balance = ssvNetwork.getAddressBalance(stakeStar);
        uint256 burnRate = ssvNetwork.getAddressBurnRate(stakeStar);

        require(address(this).balance > 0, "no eth");
        require(
            burnRate * minRunway < balance && balance < burnRate * maxRunway,
            "not necessary to swap"
        );

        uint256 amountOut = burnRate * maxRunway - balance;
        uint256 amountIn = quoter.quoteExactOutputSingle(
            wETH,
            address(ssvToken),
            fee,
            amountOut,
            0
        );

        if (amountIn > address(this).balance) amountIn = address(this).balance;

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: wETH,
                tokenOut: address(ssvToken),
                fee: fee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0, // TODO unlimited slippage!
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
                ? (uint256(amount) * commissionNumerator) /
                    COMMISSION_DENOMINATOR
                : 0;
    }
}
