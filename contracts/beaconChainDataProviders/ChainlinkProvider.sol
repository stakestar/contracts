// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/IBeaconChainDataProvider.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ChainlinkProvider is Initializable, AccessControlUpgradeable, IBeaconChainDataProvider {
    event SetFeeds(address stakingSurplusFeed);

    AggregatorV3Interface public stakingSurplusFeed;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setFeeds(address stakingSurplusFeedAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingSurplusFeed = AggregatorV3Interface(stakingSurplusFeedAddress);
        emit SetFeeds(stakingSurplusFeedAddress);
    }

    function latestStakingSurplus() public view returns (int256 stakingSurplus, uint256 timestamp) {
        (,int256 answer, uint256 startedAt,,) = stakingSurplusFeed.latestRoundData();

        stakingSurplus = answer;
        timestamp = startedAt;
    }
}
