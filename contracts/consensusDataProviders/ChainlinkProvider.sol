// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./ConsensusDataProvider.sol";

contract ChainlinkProvider is ConsensusDataProvider {
    function initialize(uint256 zeroEpochTimestamp) public initializer BCDPInitializer(zeroEpochTimestamp) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function save() public {
        revert("no implementation from Chainlink yet");
    }
}
