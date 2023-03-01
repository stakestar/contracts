// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./OracleNetwork.sol";

contract StakeStarOracle is OracleNetwork {
    function initialize(
        uint256 zeroEpochTimestamp
    ) public initializer ONInitializer(zeroEpochTimestamp) {
        _setupRole(Constants.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function save(
        uint32 epoch,
        uint256 totalBalance
    ) public onlyRole(Constants.MANAGER_ROLE) {
        _save(epoch, totalBalance);
    }
}
