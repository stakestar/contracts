// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakeStarETH is ERC20, AccessControl {
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    bytes32 public constant STAKE_STAR_ROLE = keccak256("StakeStar");

    constructor() ERC20("StakeStar ETH", "ssETH") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(STAKE_STAR_ROLE) {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function burn(
        address from,
        uint256 amount
    ) public onlyRole(STAKE_STAR_ROLE) {
        _burn(from, amount);
        emit Burn(from, amount);
    }
}
