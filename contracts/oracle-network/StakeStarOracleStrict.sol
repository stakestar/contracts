// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IOracleNetwork.sol";
import "../helpers/Utils.sol";

contract StakeStarOracleStrict is
    IOracleNetwork,
    Initializable,
    AccessControlUpgradeable
{
    uint64 public _zeroEpochTimestamp;

    uint32 private _currentEpoch;
    uint256 private _currentBalance;

    bool public _strictEpochMode;

    uint8 constant ORACLES_COUNT_MAX = 3;
    uint8 constant ORACLES_COUNT_MIN = 2;

    uint32 constant EPOCH_UPDATE_PERIOD = (24 * 3600) / Utils.EPOCH_DURATION;
    uint32 constant EPOCH_UPDATE_PERIOD_IN_SECONDS =
        EPOCH_UPDATE_PERIOD * Utils.EPOCH_DURATION;

    struct OracleData {
        uint32 next_epoch;
        uint256 next_balance;
    }

    mapping(address => uint32) private _oracleNo;
    mapping(uint32 => OracleData) private _oracleProposal;

    function initialize(uint64 zeroEpochTimestamp) public initializer {
        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
        _zeroEpochTimestamp = zeroEpochTimestamp;
    }

    event Saved(uint32 epoch, uint256 totalBalance);
    event Proposed(uint32 epoch, uint256 totalBalance, uint32 oracleBit);

    function latestTotalBalance()
        public
        view
        returns (uint256 totalBalance, uint64 timestamp)
    {
        totalBalance = _currentBalance;
        timestamp = epochToTimestamp(_currentEpoch);
    }

    function epochToTimestamp(uint32 epoch) public view returns (uint64) {
        assert(_zeroEpochTimestamp > 0);
        return _zeroEpochTimestamp + Utils.EPOCH_DURATION * uint64(epoch);
    }

    function timestampToEpoch(uint64 timestamp) public view returns (uint32) {
        assert(_zeroEpochTimestamp > 0);
        return uint32((timestamp - _zeroEpochTimestamp) / Utils.EPOCH_DURATION);
    }

    function nextEpochToPublish() public view returns (uint32) {
        (, uint64 consensusTimestamp) = latestTotalBalance();
        uint64 nextEpochTimestamp = ((uint64(block.timestamp) -
            consensusTimestamp -
            1) / EPOCH_UPDATE_PERIOD_IN_SECONDS) *
            EPOCH_UPDATE_PERIOD_IN_SECONDS +
            consensusTimestamp;
        return timestampToEpoch(nextEpochTimestamp);
    }

    function save(uint32 epoch, uint256 totalBalance) public {
        uint32 oracleNo = _oracleNo[msg.sender];
        require(oracleNo > 0, "oracle role required");

        uint64 timestamp = epochToTimestamp(epoch);
        require(timestamp < uint64(block.timestamp), "epoch from the future");

        if (_strictEpochMode) {
            require(
                epoch == nextEpochToPublish(),
                "only nextEpochToPublish() allowed"
            );
        } else {
            require(epoch >= _currentEpoch, "epoch must increase");
        }

        if (epoch == _currentEpoch) {
            if (totalBalance == _currentBalance) {
                // already in consensus, just ignore the same data
                return;
            } else {
                revert("balance not equals");
            }
        }

        OracleData storage info = _oracleProposal[oracleNo];
        require(info.next_epoch <= epoch, "epoch must increase");

        emit Proposed(
            epoch,
            totalBalance,
            uint32(1) << (uint32(23) + oracleNo)
        );

        uint32 confirmations = 1;
        for (uint32 no = 1; no <= ORACLES_COUNT_MAX; ++no) {
            if (no == oracleNo) continue;

            if (
                _oracleProposal[no].next_epoch == epoch &&
                _oracleProposal[no].next_balance == totalBalance
            ) {
                ++confirmations;
            }
        }

        if (confirmations >= ORACLES_COUNT_MIN) {
            _currentEpoch = epoch;
            _currentBalance = totalBalance;
            emit Saved(epoch, totalBalance);
        } else {
            info.next_epoch = epoch;
            info.next_balance = totalBalance;
        }
    }

    // oracle_no in [0..ORACLES_COUNT)
    function setOracle(
        address oracle,
        uint8 oracle_no
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(oracle_no < ORACLES_COUNT_MAX, "Invalid Oracle Number");
        _oracleNo[oracle] = oracle_no + 1;
    }

    function setStrictEpochMode(
        bool strictEpochMode
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        _strictEpochMode = strictEpochMode;
    }
}
