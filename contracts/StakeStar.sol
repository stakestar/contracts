// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IStakingPool} from "./IStakingPool.sol";
import {ReceiptToken} from "./ReceiptToken.sol";
import {StakeStarRewards} from "./StakeStarRewards.sol";

import {IDepositContract} from "./IDepositContract.sol";
import {ISSVNetwork} from "./ISSVNetwork.sol";

contract StakeStar is IStakingPool, Initializable, AccessControlUpgradeable {

    event Stake(address indexed staker, uint256 amount);

    struct ValidatorParams {
        bytes publicKey;
        bytes withdrawalCredentials;
        bytes signature;
        bytes32 depositDataRoot;
        uint32[] operatorIds;
        bytes[] sharesPublicKeys;
        bytes[] sharesEncrypted;
    }

    ReceiptToken public receiptToken;
    StakeStarRewards public stakeStarRewards;

    IDepositContract public depositContract;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;

    function initialize(address depositContractAddress, address ssvNetworkAddress, address ssvTokenAddress) public initializer {
        depositContract = IDepositContract(depositContractAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvNetworkAddress);

        receiptToken = new ReceiptToken();
        console.log("ReceiptToken is deployed:", address(receiptToken));

        stakeStarRewards = new StakeStarRewards();
        console.log("StakeStarRewards is deployed:", address(stakeStarRewards));

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        console.log("Owner is initialized:", msg.sender);
    }

    receive() external payable {}

    function stake() public payable {
        require(msg.value > 0, "insufficient stake amount");
        receiptToken.mint(msg.sender, msg.value);
        emit Stake(msg.sender, msg.value);
    }

    // receive ReceiptToken from msg.sender
    // burn ReceiptToken
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
        require(validatorCreationAvailable(), "validator creation not available");

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

    function validatorCreationAvailable() public view returns (bool) {
        return address(this).balance >= 32 ether;
    }

    // TBD
    function destroyValidator() public {
        revert("not implemented");
    }

    // TBD
    function validatorDestructionAvailable() public view returns (bool) {
        revert("not implemented");
    }

    function applyRewards() public {
        uint256 amount = address(stakeStarRewards).balance;
        require(amount > 0, "no rewards");

        stakeStarRewards.pull();
        receiptToken.updateRate(amount, true);
    }

    function applyPenalties(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        receiptToken.updateRate(amount, false);
    }

}
