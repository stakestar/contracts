// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

library Utils {
    uint24 constant BASE = 100_000;

    bytes32 constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 constant STAKE_STAR_ROLE = keccak256("StakeStar");
    bytes32 constant MANAGER_ROLE = keccak256("StakeStar");
    bytes32 constant TREASURY_ROLE = keccak256("Treasury");

    uint256 constant EPOCH_DURATION = 384;

    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "STE");
    }
}
