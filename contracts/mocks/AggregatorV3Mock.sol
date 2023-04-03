// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract AggregatorV3Mock is AggregatorV3Interface {
    int256 mockAnswer;
    uint256 mockTimestamp;

    function setMockValues(int256 answer, uint256 timestamp) external {
        mockAnswer = answer;
        mockTimestamp = timestamp;
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function description() external pure returns (string memory) {
        return "description";
    }

    function version() external pure returns (uint256) {
        return 0;
    }

    function getRoundData(
        uint80
    )
        external
        pure
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, 0, 0, 0, 0);
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, mockAnswer, mockTimestamp, mockTimestamp, 0);
    }
}
