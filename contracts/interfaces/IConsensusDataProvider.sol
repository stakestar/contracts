// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IConsensusDataProvider {
    function latestStakingSurplus()
        external
        view
        returns (int256 stakingSurplus, uint256 timestamp);
}
