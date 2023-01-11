// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./BeaconChainDataProvider.sol";

contract StakeStarProvider is BeaconChainDataProvider {
    function initialize(uint256 zeroEpochTimestamp) public initializer BCDPInitializer(zeroEpochTimestamp) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function save(uint32 epoch, uint256 totalBalance, uint32 validatorCount) public onlyRole(MANAGER_ROLE) {
        _save(epoch, totalBalance, validatorCount);
    }
}
