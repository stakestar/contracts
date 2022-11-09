// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakeStarTreasury is Initializable, AccessControlUpgradeable {
    using SafeMath for uint256;

    event SetCommission(uint256 numerator);
    event Withdraw(uint256 amount);

    uint256 public commissionNumerator;
    uint256 public constant commissionDenominator = 100_000;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}

    function setCommission(uint256 numerator) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(numerator <= commissionDenominator, "numerator must be in [0, 100_000]");
        commissionNumerator = numerator;
        emit SetCommission(numerator);
    }

    function withdraw(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(amount);
        emit Withdraw(amount);
    }

    function commission(uint256 amount) public view returns (uint256) {
        return amount.mul(commissionNumerator).div(commissionDenominator);
    }
}
