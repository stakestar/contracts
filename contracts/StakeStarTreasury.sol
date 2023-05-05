// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

import "./helpers/Utils.sol";

import "./interfaces/ISwapProvider.sol";
import "./interfaces/IStakingPool.sol";

import "./ssv-network/ISSVNetwork.sol";
import "./ssv-network/ISSVNetworkViews.sol";

contract StakeStarTreasury is Initializable, AccessControlUpgradeable {
    event SetAddresses(
        address stakeStarAddress,
        address ssvNetworkAddress,
        address ssvNetworkViewsAddress,
        address ssvTokenAddress,
        address swapProviderAddress
    );
    event SetCommission(uint24 value);
    event SetRunway(uint32 minRunway, uint32 maxRunway);
    event Claim(uint256 amount);
    event SwapETHAndDepositSSV(uint256 ETH, uint256 SSV, uint256 depositAmount);

    IStakingPool public stakeStar;
    IERC20 public ssvToken;
    ISwapProvider public swapProvider;

    ISSVNetwork public ssvNetwork;
    ISSVNetworkViews public ssvNetworkViews;

    // 1/100_000
    uint24 public commission;
    // measured in blocks, for 12 seconds block uint32 will be enough 1500 years
    uint32 public minRunway;
    uint32 public maxRunway;
    uint32 constant maxPossibleRunway = 365 * 24 * 3600 / 12;  // 1 year

    receive() external payable {}

    function initialize() public initializer {
        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address stakeStarAddress,
        address ssvNetworkAddress,
        address ssvNetworkViewsAddress,
        address ssvTokenAddress,
        address swapProviderAddress
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        stakeStar = IStakingPool(stakeStarAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvNetworkViews = ISSVNetworkViews(ssvNetworkViewsAddress);
        ssvToken = IERC20(ssvTokenAddress);
        swapProvider = ISwapProvider(swapProviderAddress);

        emit SetAddresses(
            stakeStarAddress,
            ssvNetworkAddress,
            ssvNetworkViewsAddress,
            ssvTokenAddress,
            swapProviderAddress
        );
    }

    function setCommission(
        uint24 value
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(value <= Utils.BASE, "value must be in [0, 100_000]");
        commission = value;
        emit SetCommission(value);
    }

    function setRunway(
        uint32 minRunwayPeriod,
        uint32 maxRunwayPeriod
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(minRunwayPeriod <= maxRunwayPeriod, "minRunway > maxRunway");
        require(maxRunwayPeriod < maxPossibleRunway, "too big maxRunway");

        minRunway = minRunwayPeriod;
        maxRunway = maxRunwayPeriod;

        emit SetRunway(minRunwayPeriod, maxRunwayPeriod);
    }

    function claim(uint256 amount) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        Utils.safeTransferETH(msg.sender, amount);
        emit Claim(amount);
    }

    function swapETHAndDepositSSV(
        uint64[] memory operatorIds,
        ISSVNetwork.Cluster memory cluster
    ) public payable onlyRole(Utils.MANAGER_ROLE) {
        require(minRunway != maxRunway, "runway not set");
        require(swapAvailability(operatorIds, cluster), "swap not available");

        address stakeStarAddress = address(stakeStar);
        uint256 balance = ssvNetworkViews.getBalance(
            stakeStarAddress,
            operatorIds,
            cluster
        );
        uint256 burnRate = ssvNetworkViews.getBurnRate(
            stakeStarAddress,
            operatorIds,
            cluster
        );
        (uint256 amountIn, uint256 amountOut) = swapProvider.swap{
            value: address(this).balance
        }(burnRate * maxRunway - balance);

        uint256 depositAmount = ssvToken.balanceOf(address(this));
        ssvToken.approve(address(ssvNetwork), depositAmount);
        ssvNetwork.deposit(
            stakeStarAddress,
            operatorIds,
            depositAmount,
            cluster
        );

        emit SwapETHAndDepositSSV(amountIn, amountOut, depositAmount);
    }

    function swapAvailability(
        uint64[] memory operatorIds,
        ISSVNetwork.Cluster memory cluster
    ) public view returns (bool) {
        address stakeStarAddress = address(stakeStar);
        uint256 balance = ssvNetworkViews.getBalance(
            stakeStarAddress,
            operatorIds,
            cluster
        );
        uint256 burnRate = ssvNetworkViews.getBurnRate(
            stakeStarAddress,
            operatorIds,
            cluster
        );

        if (burnRate == 0) return false;

        return
            address(this).balance > 0 &&
            burnRate * minRunway < balance &&
            balance < burnRate * maxRunway;
    }

    function getCommission(uint256 amount) public view returns (uint256) {
        return MathUpgradeable.mulDiv(amount, commission, Utils.BASE);
    }
}
