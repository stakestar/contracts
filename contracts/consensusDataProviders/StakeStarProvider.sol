// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/IConsensusDataProvider.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract StakeStarProvider is Initializable, AccessControlUpgradeable, IConsensusDataProvider {
    event CommitStakingSurplus(int256 stakingSurplus, uint256 timestamp);

    bytes32 public constant MANAGER_ROLE = keccak256("Manager");

    mapping(uint256 => int256) public stakingSurpluses;
    uint256 public latestTimestamp;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function commitStakingSurplus(int256 stakingSurplus, uint256 timestamp) public onlyRole(MANAGER_ROLE) {
        require(latestTimestamp < timestamp, "timestamp too old");
        stakingSurpluses[timestamp] = stakingSurplus;
        latestTimestamp = timestamp;
        emit CommitStakingSurplus(stakingSurplus, timestamp);
    }

    function latestStakingSurplus() public view returns (int256 stakingSurplus, uint256 timestamp) {
        stakingSurplus = stakingSurpluses[latestTimestamp];
        timestamp = latestTimestamp;
    }
}
