// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakeStarReceipt is ERC20, AccessControl {
    using SafeMath for uint256;

    event UpdateRate(uint256 rate);

    uint256 private _rate;

    constructor() ERC20("StakeStarReceipt", "SSR") {
        _rate = 10 ** decimals();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function rate() public view returns (uint256) {
        return _rate;
    }

    function mint(address account, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (totalSupply() == 0) {
            _rate = 10 ** decimals();
            _mint(account, amount);
        } else {
            _mint(account, amount.mul(_rate).div(10 ** decimals()));
        }
    }

    function burn(address account, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revert("not implemented");
    }

    function updateRate(uint256 amount, bool positive) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 total = totalSupply().mul(_rate).div(10 ** decimals());
        _rate = (positive ? total.add(amount) : total.sub(amount)).mul(10 ** decimals()).div(totalSupply());
        emit UpdateRate(_rate);
    }
}
