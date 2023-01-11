// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./BeaconChainDataProvider.sol";

contract ChainlinkProvider is Initializable, AccessControlUpgradeable, BeaconChainDataProvider {
    function initialize(uint256 zeroEpochTimestamp) public initializer BCDPInitializer(zeroEpochTimestamp) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function save() public {
        revert("no implementation from Chainlink");
    }
}
