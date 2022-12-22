// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/IConsensusDataProvider.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract StakeStarProvider is Initializable, AccessControlUpgradeable, IConsensusDataProvider {
    event CommitStakingBalance(uint256 stakingBalance, uint256 timestamp);

    bytes32 public constant MANAGER_ROLE = keccak256("Manager");

    mapping(uint256 => uint256) public stakingBalances;
    uint256 public latestTimestamp;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function commitStakingBalance(uint256 stakingBalance, uint256 timestamp) public onlyRole(MANAGER_ROLE) {
        require(latestTimestamp < timestamp, "timestamp too old");
        stakingBalances[timestamp] = stakingBalance;
        latestTimestamp = timestamp;
        emit CommitStakingBalance(stakingBalance, timestamp);
    }

    function latestStakingBalance() public view returns (uint256 stakingBalance, uint256 timestamp) {
        stakingBalance = stakingBalances[latestTimestamp];
        timestamp = latestTimestamp;
    }
}
