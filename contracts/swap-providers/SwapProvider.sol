// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/ISwapProvider.sol";
import "../helpers/Utils.sol";

abstract contract SwapProvider is
    ISwapProvider,
    Initializable,
    AccessControlUpgradeable
{
    event Swap(uint256 amountIn, uint256 amountOut);

    function swap(
        uint256 desiredAmountOut
    )
        public
        payable
        override
        onlyRole(Utils.TREASURY_ROLE)
        returns (uint256 amountIn, uint256 amountOut)
    {
        (amountIn, amountOut) = _swap(desiredAmountOut);
        emit Swap(amountIn, amountOut);
    }

    function _swap(
        uint256 desiredAmountOut
    ) internal virtual returns (uint256 amountIn, uint256 amountOut);
}
