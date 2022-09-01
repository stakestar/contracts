// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract StakeStarRegistry is Initializable, AccessControlUpgradeable {
    event AddOperatorToAllowList(uint32 operatorId);
    event RemoveOperatorFromAllowList(uint32 operatorId);

    mapping(uint32 => bool) public allowListOfOperators;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addOperatorToAllowList(uint32 operatorId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!allowListOfOperators[operatorId], "already in the list");
        allowListOfOperators[operatorId] = true;
        emit AddOperatorToAllowList(operatorId);
    }

    function removeOperatorFromAllowList(uint32 operatorId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(allowListOfOperators[operatorId], "not in the list");
        delete allowListOfOperators[operatorId];
        emit RemoveOperatorFromAllowList(operatorId);
    }

    function isOperatorAllowListed(uint32 operatorId) public view returns (bool) {
        return allowListOfOperators[operatorId];
    }
}
