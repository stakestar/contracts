// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./helpers/Constants.sol";

contract StakeStarETH is ERC20, AccessControl {
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    constructor() ERC20("StakeStar ETH", "ssETH") {
        _setupRole(Constants.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(
        address to,
        uint256 amount
    ) public onlyRole(Constants.STAKE_STAR_ROLE) {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function burn(
        address from,
        uint256 amount
    ) public onlyRole(Constants.STAKE_STAR_ROLE) {
        _burn(from, amount);
        emit Burn(from, amount);
    }
}
