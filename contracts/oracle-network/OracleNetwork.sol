// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IOracleNetwork.sol";

abstract contract OracleNetwork is
    IOracleNetwork,
    Initializable,
    AccessControlUpgradeable
{
    event Saved(uint32 epoch, uint256 totalBalance);

    modifier ONInitializer(uint256 zeroEpochTimestamp) {
        _zeroEpochTimestamp = zeroEpochTimestamp;
        _;
    }

    bytes32 public constant MANAGER_ROLE = keccak256("Manager");

    uint32 public _latestEpoch;
    mapping(uint32 => uint256) public _totalBalance;

    uint256 public _zeroEpochTimestamp;
    uint256 public constant EPOCH_DURATION = 384;

    function _save(uint32 epoch, uint256 totalBalance) internal {
        uint256 timestamp = epochTimestamp(epoch);

        require(epoch <= _latestEpoch, "epoch too old");
        require(timestamp >= block.timestamp, "epoch from the future");

        _latestEpoch = epoch;
        _totalBalance[epoch] = totalBalance;

        emit Saved(epoch, totalBalance);
    }

    function latestTotalBalance()
        public
        view
        returns (uint256 totalBalance, uint256 timestamp)
    {
        totalBalance = _totalBalance[_latestEpoch];
        timestamp = epochTimestamp(_latestEpoch);
    }

    function epochTimestamp(uint32 epoch) public view returns (uint256) {
        require(_zeroEpochTimestamp > 0, "not initialized");
        return _zeroEpochTimestamp + EPOCH_DURATION * uint256(epoch);
    }
}
