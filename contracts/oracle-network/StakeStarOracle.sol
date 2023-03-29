// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IOracleNetwork.sol";
import "../helpers/Utils.sol";

contract StakeStarOracle is
    IOracleNetwork,
    Initializable,
    AccessControlUpgradeable
{
    // variable pairs has meaning on of
    // 1) current known epoch-balance consensus of the oracles
    // 2) new epoch-balance values is in progress to establish consensus

    uint32 private _epoch1;
    uint96 private _totalBalance1;

    uint32 private _epoch2;
    uint96 private _totalBalance2;

    uint64 public _zeroEpochTimestamp;
    uint32 _epochUpdateTimePeriodInSeconds;
    bool public _strictEpochMode;

    uint8 constant ORACLES_COUNT_MAX = 3;
    uint8 constant ORACLES_COUNT_MIN = 2;

    uint32 constant ORACLES_COUNT_MASK = 0x0700_0000;
    uint32 constant EPOCH_VALUE_MASK = 0x00FF_FFFF;

    // from address to oracle bit = (1 << oracle_no) << 24;
    mapping(address => uint32) private _oracles;

    function initialize(uint64 zeroEpochTimestamp) public initializer {
        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
        _zeroEpochTimestamp = zeroEpochTimestamp;
        setEpochUpdatePeriod(uint32(24 * 3600) / Utils.EPOCH_DURATION);
    }

    event Saved(uint32 epoch, uint256 totalBalance);
    event Proposed(uint32 epoch, uint256 totalBalance, uint32 oracleBit);

    function has_consensus(uint32 epoch) private pure returns (bool) {
        // for 2 in 3
        uint32 masked = epoch & ORACLES_COUNT_MASK;
        return masked == (3 << 24) || masked >= (5 << 24);
    }

    function latestTotalBalance()
        public
        view
        returns (uint256 totalBalance, uint64 timestamp)
    {
        uint32 epoch1 = _epoch1;
        bool epoch1_in_consensus = has_consensus(epoch1);
        epoch1 &= EPOCH_VALUE_MASK;

        uint32 epoch2 = _epoch2;
        bool epoch2_in_consensus = has_consensus(epoch2);
        epoch2 &= EPOCH_VALUE_MASK;

        if (epoch1_in_consensus && epoch2_in_consensus) {
            // both in consensus - take the latest
            if (epoch1 >= epoch2) {
                totalBalance = _totalBalance1;
                timestamp = epochToTimestamp(epoch1);
            } else {
                totalBalance = _totalBalance2;
                timestamp = epochToTimestamp(epoch2);
            }
        } else if (epoch1_in_consensus) {
            totalBalance = _totalBalance1;
            timestamp = epochToTimestamp(epoch1);
        } else {
            // epoch2_in_consensus or no any consensus yet (zero state)
            totalBalance = _totalBalance2;
            timestamp = epochToTimestamp(epoch2);
        }
    }

    function epochToTimestamp(uint32 epoch) public view returns (uint64) {
        assert(_zeroEpochTimestamp > 0);
        return _zeroEpochTimestamp + uint64(Utils.EPOCH_DURATION) * uint64(epoch);
    }

    function timestampToEpoch(uint64 timestamp) public view returns (uint32) {
        assert(_zeroEpochTimestamp > 0);
        return uint32((timestamp - _zeroEpochTimestamp) / uint64(Utils.EPOCH_DURATION));
    }

    function nextEpochToPublish() public view returns (uint32) {
        (, uint64 consensusTimestamp) = latestTotalBalance();
        uint64 nextEpochTimestamp = (uint64(block.timestamp) - consensusTimestamp - 1)
                                        / _epochUpdateTimePeriodInSeconds
                                        * _epochUpdateTimePeriodInSeconds
                                    + consensusTimestamp;
        return timestampToEpoch(nextEpochTimestamp);
    }

    function save(uint32 epoch, uint256 totalBalance) public {
        uint32 oracle_bit = _oracles[msg.sender];
        require(oracle_bit > 0, "oracle role required");

        uint64 timestamp = epochToTimestamp(epoch);
        require(timestamp < uint64(block.timestamp), "epoch from the future");

        if (_strictEpochMode) {
            require(
                epoch == nextEpochToPublish(),
                "only nextEpochToPublish() allowed"
            );
        }

        uint32 epoch1 = _epoch1;
        bool epoch1_in_consensus = has_consensus(epoch1);
        epoch1 &= EPOCH_VALUE_MASK;

        uint32 epoch2 = _epoch2;
        bool epoch2_in_consensus = has_consensus(epoch2);
        epoch2 &= EPOCH_VALUE_MASK;

        // in case of reversion, event logs is throwing away
        emit Proposed(epoch, totalBalance, oracle_bit);

        if (epoch1 <= epoch2) {
            // 1 - current
            // 2 - new consensus in progress
            if (epoch == epoch2) {
                // continue progress in (2)
                require(
                    _epoch2 & oracle_bit == 0,
                    "oracle already submitted result"
                );
                require(totalBalance == _totalBalance2, "balance not equals");
                _epoch2 |= oracle_bit;

                if (has_consensus(_epoch2) && !epoch2_in_consensus) {
                    emit Saved(epoch, totalBalance);
                }
            } else {
                require(epoch > epoch2, "epoch must increase");
                if (epoch2_in_consensus) {
                    // 2 - current
                    // 1 - old, not used
                    _epoch1 = epoch | oracle_bit;
                    _totalBalance1 = uint96(totalBalance);
                } else {
                    // reset not finished progress in (2)
                    _epoch2 = epoch | oracle_bit;
                    _totalBalance2 = uint96(totalBalance);
                }
            }
        } else {
            // epoch2 < epoch1
            // 2 - current
            // 1 - new consensus in progress
            if (epoch == epoch1) {
                // continue progress in (1)
                require(
                    _epoch1 & oracle_bit == 0,
                    "oracle already submitted result"
                );
                require(totalBalance == _totalBalance1, "balance not equals");
                _epoch1 |= oracle_bit;

                if (has_consensus(_epoch1) && !epoch1_in_consensus) {
                    emit Saved(epoch, totalBalance);
                }
            } else {
                require(epoch > epoch1, "epoch must increase");
                if (epoch1_in_consensus) {
                    // 1 - current
                    // 2 - old, not used
                    _epoch2 = epoch | oracle_bit;
                    _totalBalance2 = uint96(totalBalance);
                } else {
                    // reset not finished progress in (1)
                    _epoch1 = epoch | oracle_bit;
                    _totalBalance1 = uint96(totalBalance);
                }
            }
        }
    }

    // oracle_no in [0..ORACLES_COUNT)
    function setOracle(
        address oracle,
        uint8 oracle_no
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(oracle_no < ORACLES_COUNT_MAX, "invalid oracle number");
        _oracles[oracle] = uint32((1 << oracle_no) << 24);
    }

    function setStrictEpochMode(
        bool strictEpochMode
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        _strictEpochMode = strictEpochMode;
    }

    function setEpochUpdatePeriod(
        uint32 period_in_epochs
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(period_in_epochs >= 1, "invalid period");
        _epochUpdateTimePeriodInSeconds = period_in_epochs * Utils.EPOCH_DURATION;
    }
}
