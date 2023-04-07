// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./../helpers/Utils.sol";

contract UtilsMock {
    function addressToWithdrawalCredentials(
        address _address
    ) public pure returns (bytes memory) {
        return Utils.addressToWithdrawalCredentials(_address);
    }

    function compareBytes(
        bytes memory a,
        bytes memory b
    ) public pure returns (bool) {
        return Utils.compareBytes(a, b);
    }
}
