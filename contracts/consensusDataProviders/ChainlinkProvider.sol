// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/IConsensusDataProvider.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ChainlinkProvider is Initializable, AccessControlUpgradeable, IConsensusDataProvider {
    event SetFeeds(address stakingBalanceFeed);

    AggregatorV3Interface public stakingBalanceFeed;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setFeeds(address stakingBalanceFeedAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingBalanceFeed = AggregatorV3Interface(stakingBalanceFeedAddress);
        emit SetFeeds(stakingBalanceFeedAddress);
    }

    function latestStakingBalance() public view returns (uint256 stakingBalance, uint256 timestamp) {
        (,int256 answer, uint256 startedAt,,) = stakingBalanceFeed.latestRoundData();

        stakingBalance = uint256(answer);
        timestamp = startedAt;
    }
}
