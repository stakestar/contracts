// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/ISSVNetwork.sol";
import "./interfaces/ISwapProvider.sol";

contract StakeStarTreasury is Initializable, AccessControlUpgradeable {
    event SetCommission(uint24 value);
    event SetAddresses(
        address stakeStarAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapProviderAddress
    );
    event SetRunway(uint256 minRunway, uint256 maxRunway);
    event ReceiveETH(uint256 value);
    event Claim(uint256 value);
    event SwapETHAndDepositSSV(uint256 ETH, uint256 SSV, uint256 depositAmount);

    uint24 public commission;

    address public stakeStar;

    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;
    ISwapProvider public swapProvider;

    uint256 public minRunway;
    uint256 public maxRunway;

    receive() external payable {
        require(msg.value > 0, "msg.value = 0");
        emit ReceiveETH(msg.value);
    }

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setCommission(uint24 value) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(value <= 100_000, "value must be in [0, 100_000]");
        commission = value;
        emit SetCommission(value);
    }

    function setAddresses(
        address stakeStarAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapProviderAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        stakeStar = stakeStarAddress;
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

    function setRunway(
        uint256 minRunwayPeriod,
        uint256 maxRunwayPeriod
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(minRunwayPeriod <= maxRunwayPeriod, "minRunway > maxRunway");

        minRunway = minRunwayPeriod;
        maxRunway = maxRunwayPeriod;

        emit SetRunway(minRunwayPeriod, maxRunwayPeriod);
    }

    function claim(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(amount);
        emit Claim(amount);
    }

    function swapETHAndDepositSSV() public payable {
        require(minRunway != maxRunway, "runway not set");
        require(swapAvailability(), "swap not available");

        uint256 balance = ssvNetwork.getAddressBalance(stakeStar);
        uint256 burnRate = ssvNetwork.getAddressBurnRate(stakeStar);
        (uint256 amountIn, uint256 amountOut) = swapProvider.swap{
            value: address(this).balance
        }(burnRate * maxRunway - balance);

        uint256 depositAmount = (ssvToken.balanceOf(address(this)) / 1e7) * 1e7;
        ssvToken.approve(address(ssvNetwork), depositAmount);
        ssvNetwork.deposit(stakeStar, depositAmount);

        emit SwapETHAndDepositSSV(amountIn, amountOut, depositAmount);
    }

    function swapAvailability() public view returns (bool) {
        uint256 balance = ssvNetwork.getAddressBalance(stakeStar);
        uint256 burnRate = ssvNetwork.getAddressBurnRate(stakeStar);

        return
            address(this).balance > 0 &&
            burnRate * minRunway < balance &&
            balance < burnRate * maxRunway;
    }

    function getCommission(int256 amount) public view returns (uint256) {
        return amount > 0 ? (uint256(amount) * commission) / 100_000 : 0;
    }
}
