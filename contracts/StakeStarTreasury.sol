// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

import "./interfaces/ISSVNetwork.sol";
import "./interfaces/ISwapProvider.sol";
import "./interfaces/IStakingPool.sol";
import "./helpers/Utils.sol";

contract StakeStarTreasury is Initializable, AccessControlUpgradeable {
    event SetAddresses(
        address stakeStarAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapProviderAddress
    );
    event SetCommission(uint24 value);
    event SetRunway(uint256 minRunway, uint256 maxRunway);
    event Claim(uint256 amount);
    event SwapETHAndDepositSSV(uint256 ETH, uint256 SSV, uint256 depositAmount);

    IStakingPool public stakeStar;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;
    ISwapProvider public swapProvider;

    uint24 public commission;
    uint256 public minRunway;
    uint256 public maxRunway;

    receive() external payable {}

    function initialize() public initializer {
        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address stakeStarAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapProviderAddress
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        stakeStar = IStakingPool(stakeStarAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvTokenAddress);
        swapProvider = ISwapProvider(swapProviderAddress);

        emit SetAddresses(
            stakeStarAddress,
            ssvNetworkAddress,
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
        uint256 minRunwayPeriod,
        uint256 maxRunwayPeriod
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(minRunwayPeriod <= maxRunwayPeriod, "minRunway > maxRunway");

        minRunway = minRunwayPeriod;
        maxRunway = maxRunwayPeriod;

        emit SetRunway(minRunwayPeriod, maxRunwayPeriod);
    }

    function claim(uint256 amount) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        Utils.safeTransferETH(msg.sender, amount);
        emit Claim(amount);
    }

    function swapETHAndDepositSSV() public payable {
        require(minRunway != maxRunway, "runway not set");
        require(swapAvailability(), "swap not available");

        address stakeStarAddress = address(stakeStar);
        uint256 balance = ssvNetwork.getAddressBalance(stakeStarAddress);
        uint256 burnRate = ssvNetwork.getAddressBurnRate(stakeStarAddress);
        (uint256 amountIn, uint256 amountOut) = swapProvider.swap{
            value: address(this).balance
        }(burnRate * maxRunway - balance);

        uint256 depositAmount = (ssvToken.balanceOf(address(this)) / 1e7) * 1e7;
        ssvToken.approve(address(ssvNetwork), depositAmount);
        ssvNetwork.deposit(stakeStarAddress, depositAmount);

        emit SwapETHAndDepositSSV(amountIn, amountOut, depositAmount);
    }

    function swapAvailability() public view returns (bool) {
        address stakeStarAddress = address(stakeStar);
        uint256 balance = ssvNetwork.getAddressBalance(stakeStarAddress);
        uint256 burnRate = ssvNetwork.getAddressBurnRate(stakeStarAddress);

        return
            address(this).balance > 0 &&
            burnRate * minRunway < balance &&
            balance < burnRate * maxRunway;
    }

    function getCommission(uint256 amount) public view returns (uint256) {
        return MathUpgradeable.mulDiv(amount, commission, Utils.BASE);
    }
}
