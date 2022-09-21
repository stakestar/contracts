// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakeStarETH is ERC20, AccessControl {
    using SafeMath for uint256;

    event Mint(address indexed to, uint256 ssETH, uint256 rate);
    event Burn(address indexed from, uint256 ssETH, uint256 rate);
    event UpdateRate(uint256 rate);

    bytes32 public constant STAKE_STAR_ROLE = keccak256("StakeStar");

    uint256 public rate; // ETH = ssETH * rate

    constructor() ERC20("StakeStar ETH", "ssETH") {
        rate = _rate(1, 1);
        _setupRole(STAKE_STAR_ROLE, msg.sender);
    }

    function mint(address account, uint256 eth) public onlyRole(STAKE_STAR_ROLE) {
        uint256 ssETH = ETH_to_ssETH(eth);
        _mint(account, ssETH);
        emit Mint(account, ssETH, rate);
    }

    function burn(address account, uint256 eth) public onlyRole(STAKE_STAR_ROLE) {
        uint256 ssETH = ETH_to_ssETH(eth);
        _burn(account, ssETH);
        emit Burn(account, ssETH, rate);
    }

    function updateRate(uint256 ethChange, bool positiveOrNegative) public onlyRole(STAKE_STAR_ROLE) {
        uint256 ETH = ssETH_to_ETH(totalSupply());
        rate = _rate(positiveOrNegative ? ETH.add(ethChange) : ETH.sub(ethChange), totalSupply());
        emit UpdateRate(rate);
    }

    function ssETH_to_ETH(uint256 ssETH) public view returns (uint256) {
        return ssETH.mul(rate).div(1 ether);
    }

    function ETH_to_ssETH(uint256 eth) public view returns (uint256) {
        return eth.mul(1 ether).div(rate);
    }

    function _rate(uint256 eth, uint256 ssETH) private pure returns (uint256) {
        return eth.mul(1 ether).div(ssETH);
    }
}
