// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/ISSVNetwork.sol";
import "./interfaces/ISwapProvider.sol";

contract StakeStarTreasury is Initializable, AccessControlUpgradeable {
    event SetCommission(uint24 numerator);
    event SetAddresses(
        address stakeStarAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapProviderAddress
    );
    event SetRunway(uint256 minRunway, uint256 maxRunway);
    event Withdraw(uint256 amount);
    event SwapETHAndDepositSSV(uint256 ETH, uint256 SSV, uint256 depositAmount);

    uint24 public commissionNumerator;
    uint24 public slippageNumerator;
    uint24 public constant DENOMINATOR = 100_000;

    address public stakeStar;

    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;
    ISwapProvider public swapProvider;

    uint256 public minRunway;
    uint256 public maxRunway;

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

    function withdraw(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(amount);
        emit Withdraw(amount);
    }

    function swapETHAndDepositSSV() public {
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

    function commission(int256 amount) public view returns (uint256) {
        return
            amount > 0
                ? (uint256(amount) * commissionNumerator) / DENOMINATOR
                : 0;
    }
}
