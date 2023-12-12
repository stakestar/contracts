// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./../helpers/Utils.sol";

contract StarETH is ERC20, AccessControl {
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    mapping(address => uint32) public history;

    constructor() ERC20("StarETH", "starETH") {
        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(
        address to,
        uint256 amount
    ) public onlyRole(Utils.STAKE_STAR_ROLE) {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function burn(
        address from,
        uint256 amount
    ) public onlyRole(Utils.STAKE_STAR_ROLE) {
        _burn(from, amount);
        emit Burn(from, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from != address(0)) {
            history[to] = uint32(block.number);
        }
    }
}
