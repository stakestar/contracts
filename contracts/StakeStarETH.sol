// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakeStarETH is ERC20, AccessControl {
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event UpdateRate(uint256 rate, int256 ethChange);

    bytes32 public constant STAKE_STAR_ROLE = keccak256("StakeStar");

    uint256 public rate; // ETH = ssETH * rate

    constructor() ERC20("StakeStar ETH", "ssETH") {
        rate = _rate(0, 0);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address account, uint256 ssETH) public onlyRole(STAKE_STAR_ROLE) {
        _mint(account, ssETH);
        emit Mint(account, ssETH);
    }

    function burn(address account, uint256 ssETH) public onlyRole(STAKE_STAR_ROLE) {
        _burn(account, ssETH);
        emit Burn(account, ssETH);
    }

    function updateRate(int256 ethChange) public onlyRole(STAKE_STAR_ROLE) {
        rate = estimateRate(ethChange);
        emit UpdateRate(rate, ethChange);
    }

    function totalSupplyEth() public view returns (uint256) {
        return ssETH_to_ETH(totalSupply());
    }

    function estimateRate(int256 ethChange) public view returns (uint256) {
        int256 totalSupplyEth = int256(totalSupplyEth()) + ethChange;
        require(totalSupplyEth >= 0, "pool cannot have negative balance");

        return _rate(uint256(totalSupplyEth), totalSupply());
    }

    function ssETH_to_ETH(uint256 ssETH) public view returns (uint256) {
        return ssETH * rate / 1 ether;
    }

    function ETH_to_ssETH(uint256 eth) public view returns (uint256) {
        return eth * 1 ether / rate;
    }

    function _rate(uint256 eth, uint256 ssETH) private pure returns (uint256) {
        if (eth == 0 && ssETH == 0) return 1 ether;
        else return eth * 1 ether / ssETH;
    }
}
