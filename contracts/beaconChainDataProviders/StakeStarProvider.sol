// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./BeaconChainDataProvider.sol";

contract StakeStarProvider is Initializable, AccessControlUpgradeable, BeaconChainDataProvider {
    bytes32 public constant MANAGER_ROLE = keccak256("Manager");

    function initialize(uint256 zeroEpochTimestamp) public initializer BCDPInitializer(zeroEpochTimestamp) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function save(uint32 epoch, uint256 totalBalance, uint32 validatorCount) public onlyRole(MANAGER_ROLE) {
        _save(epoch, totalBalance, validatorCount);
    }
}
