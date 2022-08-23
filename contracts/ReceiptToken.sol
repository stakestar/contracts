// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ReceiptToken is ERC20, AccessControl {
    constructor() ERC20("Receipt", "RCPT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address account, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(account, amount);
    }
}
