// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IStakingPool} from "./IStakingPool.sol";
import {StakeStarRegistry} from "./StakeStarRegistry.sol";
import {StakeStarETH} from "./StakeStarETH.sol";
import {StakeStarRewards} from "./StakeStarRewards.sol";

import {IDepositContract} from "./IDepositContract.sol";
import {ISSVNetwork} from "./ISSVNetwork.sol";

contract StakeStar is IStakingPool, Initializable, AccessControlUpgradeable {
    struct ValidatorParams {
        bytes publicKey;
        bytes withdrawalCredentials;
        bytes signature;
        bytes32 depositDataRoot;
        uint32[] operatorIds;
        bytes[] sharesPublicKeys;
        bytes[] sharesEncrypted;
    }

    StakeStarRegistry public stakeStarRegistry;
    StakeStarETH public stakeStarETH;
    StakeStarRewards public stakeStarRewards;

    IDepositContract public depositContract;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;

    function initialize(
        address depositContractAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address stakeStarRegistryAddress
    ) public initializer {
        depositContract = IDepositContract(depositContractAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvTokenAddress);

        stakeStarRegistry = StakeStarRegistry(stakeStarRegistryAddress);
        stakeStarETH = new StakeStarETH();
        stakeStarRewards = new StakeStarRewards();

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}

    function stake() public payable {
        require(msg.value > 0, "SS S");
        stakeStarETH.mint(msg.sender, msg.value);
    }

    // receive StakeStarETH from msg.sender
    // burn StakeStarETH
    // initiate unstake operation
    function unstake(uint256 amount) public {
        revert("not implemented");
    }

    // transfer ETH to msg.sender
    // complete unstake operation
    function claim() public {
        revert("not implemented");
    }

    function createValidator(ValidatorParams calldata validatorParams, uint256 ssvDepositAmount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(validatorCreationAvailability(), "SS CV");

        stakeStarRegistry.createValidator(validatorParams.publicKey);

        depositContract.deposit{value : 32 ether}(
            validatorParams.publicKey,
            validatorParams.withdrawalCredentials,
            validatorParams.signature,
            validatorParams.depositDataRoot
        );

        ssvToken.approve(address(ssvNetwork), ssvDepositAmount);
        ssvNetwork.registerValidator(
            validatorParams.publicKey,
            validatorParams.operatorIds,
            validatorParams.sharesPublicKeys,
            validatorParams.sharesEncrypted,
            ssvDepositAmount
        );
    }

    function validatorCreationAvailability() public view returns (bool) {
        return address(this).balance >= 32 ether;
    }

    // TBD
    function destroyValidator(bytes memory publicKey) public {
        require(validatorDestructionAvailability(), "SS DV");

        stakeStarRegistry.destroyValidator(publicKey);

        revert("not implemented");
    }

    // TBD
    function validatorDestructionAvailability() public view returns (bool) {
        revert("not implemented");
    }

    function applyRewards() public {
        uint256 amount = address(stakeStarRewards).balance;
        require(amount > 0, "SS AR");

        stakeStarRewards.pull();
        stakeStarETH.updateRate(amount, true);
    }

    function applyPenalties(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount > 0, "SS AP");
        stakeStarETH.updateRate(amount, false);
    }
}
