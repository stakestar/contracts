// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

abstract contract BeaconChainDataProvider {
    error ValidationFailed(uint16 code);

    modifier BCDPInitializer(uint256 zeroEpochTimestamp) {
        _zeroEpochTimestamp = _zeroEpochTimestamp;
        _;
    }

    uint32 _latestEpoch;
    mapping(uint32 => uint256) public _totalBalance;
    mapping(uint32 => uint32) public _validatorCount;

    uint256 public _zeroEpochTimestamp;
    uint256 public constant _epochDuration = 384;

    uint256 public _avgValidatorBalanceLowerLimit;
    uint256 public _avgValidatorBalanceUpperLimit;
    uint256 public _epochGapLimit;
    uint256 public _aprLimit;
    uint32 public _validatorCountDiffLimit;

    function _save(uint32 epoch, uint256 totalBalance, uint32 validatorCount) internal {
        require(_zeroEpochTimestamp > 0, "_zeroEpochTimestamp not initialized");

        uint16 validationResult = validate(epoch, totalBalance, validatorCount);
        if (validationResult != 0) {
            revert ValidationFailed({code : validationResult});
        }

        _latestEpoch = epoch;
        _totalBalance[epoch] = totalBalance;
        _validatorCount[epoch] = validatorCount;
    }

    // return values
    // 0 - OK
    // 1 - given epoch is younger that latestEpoch
    // 2 - given epoch is from the future
    // 3 - epochGap > epochGapLimit
    // 4 - avgValidatorBalance is out of bounds
    // 5 - apr > aprLimit
    // 6 - validatorCountDiff > validatorCountDiffLimit
    function validate(uint32 epoch, uint256 totalBalance, uint32 validatorCount) public view returns (uint16) {
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
                uint256 previousAvgValidatorBalance = previousTotalBalance / previousValidatorCount;
                if (previousAvgValidatorBalance < avgValidatorBalance) {
                    uint256 surplus = avgValidatorBalance - previousAvgValidatorBalance;
                    uint256 period = givenEpochTimestamp - epochTimestamp(_latestEpoch);

                    // raw estimation of APR
                    if (31536000 / period * surplus / 32 ether > _aprLimit) {
                        return 5;
                    }
                }
            }
        }

        uint32 latestValidatorCount = _validatorCount[_latestEpoch];
        if (
            (validatorCount < latestValidatorCount && latestValidatorCount - validatorCount > _validatorCountDiffLimit) ||
            (validatorCount > latestValidatorCount && validatorCount - latestValidatorCount > _validatorCountDiffLimit)
        ) return 6;

        return 0;
    }

    function latestStakingSurplus() public view returns (int256 stakingSurplus, uint256 timestamp) {
        stakingSurplus = int256(_totalBalance[_latestEpoch]) - int256(int32(_validatorCount[_latestEpoch])) * int256(32 ether);
        timestamp = epochTimestamp(_latestEpoch);
    }

    function epochTimestamp(uint32 epoch) public view returns (uint256) {
        return _zeroEpochTimestamp + _epochDuration * uint256(epoch);
    }
}
