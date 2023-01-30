// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IConsensusDataProvider.sol";

abstract contract ConsensusDataProvider is
    IConsensusDataProvider,
    Initializable,
    AccessControlUpgradeable
{
    error ValidationFailed(uint16 code);

    modifier CDPInitializer(uint256 zeroEpochTimestamp) {
        _zeroEpochTimestamp = zeroEpochTimestamp;
        _;
    }

    event SetLimits(
        uint256 avgValidatorBalanceLowerLimit,
        uint256 avgValidatorBalanceUpperLimit,
        uint256 epochGapLimit,
        uint256 aprLimit,
        uint32 validatorCountDiffLimit
    );
    event Saved(uint32 epoch, uint256 totalBalance, uint32 validatorCount);

    bytes32 public constant MANAGER_ROLE = keccak256("Manager");

    uint32 public _latestEpoch;
    mapping(uint32 => uint256) public _totalBalance;
    mapping(uint32 => uint32) public _validatorCount;

    uint256 public _zeroEpochTimestamp;
    uint256 public constant EPOCH_DURATION = 384;

    uint256 public _avgValidatorBalanceLowerLimit;
    uint256 public _avgValidatorBalanceUpperLimit;
    uint256 public _epochGapLimit; // in seconds
    uint256 public _aprLimit; // excess over 32 eth after a year
    uint32 public _validatorCountDiffLimit;

    function setLimits(
        uint256 avgValidatorBalanceLowerLimit,
        uint256 avgValidatorBalanceUpperLimit,
        uint256 epochGapLimit,
        uint256 aprLimit,
        uint32 validatorCountDiffLimit
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _avgValidatorBalanceLowerLimit = avgValidatorBalanceLowerLimit;
        _avgValidatorBalanceUpperLimit = avgValidatorBalanceUpperLimit;
        _epochGapLimit = epochGapLimit;
        _aprLimit = aprLimit;
        _validatorCountDiffLimit = validatorCountDiffLimit;

        emit SetLimits(
            avgValidatorBalanceLowerLimit,
            avgValidatorBalanceUpperLimit,
            epochGapLimit,
            aprLimit,
            validatorCountDiffLimit
        );
    }

    function _save(
        uint32 epoch,
        uint256 totalBalance,
        uint32 validatorCount
    ) internal {
        uint16 validationResult = validate(epoch, totalBalance, validatorCount);
        if (validationResult != 0) {
            revert ValidationFailed({code: validationResult});
        }

        _latestEpoch = epoch;
        _totalBalance[epoch] = totalBalance;
        _validatorCount[epoch] = validatorCount;

        emit Saved(epoch, totalBalance, validatorCount);
    }

    // return values
    // 0 - OK
    // 1 - given epoch is younger than latestEpoch
    // 2 - given epoch is from the future
    // 3 - epochGap > epochGapLimit
    // 4 - avgValidatorBalance is out of bounds
    // 5 - apr > aprLimit
    // 6 - validatorCountDiff > validatorCountDiffLimit
    function validate(
        uint32 epoch,
        uint256 totalBalance,
        uint32 validatorCount
    ) public view returns (uint16) {
        if (epoch <= _latestEpoch) return 1;

        uint256 givenEpochTimestamp = epochTimestamp(epoch);
        if (givenEpochTimestamp >= block.timestamp) return 2;
        if (block.timestamp - givenEpochTimestamp > _epochGapLimit) return 3;

        if (validatorCount > 0) {
            uint256 avgValidatorBalance = totalBalance / validatorCount;
            if (
                avgValidatorBalance < _avgValidatorBalanceLowerLimit ||
                avgValidatorBalance > _avgValidatorBalanceUpperLimit
            ) return 4;

            uint256 previousTotalBalance = _totalBalance[_latestEpoch];
            uint256 previousValidatorCount = _validatorCount[_latestEpoch];
            if (previousValidatorCount > 0) {
                uint256 previousAvgValidatorBalance = previousTotalBalance /
                    previousValidatorCount;
                if (previousAvgValidatorBalance < avgValidatorBalance) {
                    uint256 surplus = avgValidatorBalance -
                        previousAvgValidatorBalance;
                    uint256 period = givenEpochTimestamp -
                        epochTimestamp(_latestEpoch);

                    // very raw estimation of APR
                    if ((31536000 / period) * surplus > _aprLimit) {
                        return 5;
                    }
                }
            }
        }

        uint32 latestValidatorCount = _validatorCount[_latestEpoch];
        if (
            (validatorCount < latestValidatorCount &&
                latestValidatorCount - validatorCount >
                _validatorCountDiffLimit) ||
            (validatorCount > latestValidatorCount &&
                validatorCount - latestValidatorCount >
                _validatorCountDiffLimit)
        ) return 6;

        return 0;
    }

    function latestStakingSurplus()
        public
        view
        returns (int256 stakingSurplus, uint256 timestamp)
    {
        stakingSurplus =
            int256(_totalBalance[_latestEpoch]) -
            int256(int32(_validatorCount[_latestEpoch])) *
            int256(32 ether);
        timestamp = epochTimestamp(_latestEpoch);
    }

    function epochTimestamp(uint32 epoch) public view returns (uint256) {
        require(_zeroEpochTimestamp > 0, "not initialized");
        return _zeroEpochTimestamp + EPOCH_DURATION * uint256(epoch);
    }
}
