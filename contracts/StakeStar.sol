// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {IStakingPool} from "./IStakingPool.sol";
import {StakeStarRegistry} from "./StakeStarRegistry.sol";
import {StakeStarETH} from "./StakeStarETH.sol";
import {StakeStarRewards} from "./StakeStarRewards.sol";

import {IDepositContract} from "./IDepositContract.sol";
import {ISSVNetwork} from "./ISSVNetwork.sol";

// TODO Maintain SSV position in SSVNetwork contract
// TODO Create validator destruction conditions
// TODO Prevent double validator destroy
// TODO Add local pool filling on validator destroy
contract StakeStar is IStakingPool, Initializable, AccessControlUpgradeable {
    using SafeMath for uint256;

    event SetLocalPoolSize(uint256 size);
    event CreateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event UpdateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event DestroyValidator(bytes publicKey);
    event Stake(address who, uint256 amount);
    event Unstake(address who, uint256 amount);
    event Claim(address who, uint256 amount);
    event ApplyRewards(uint256 amount);
    event ApplyPenalties(uint256 amount);

    struct ValidatorParams {
        bytes publicKey;
        bytes withdrawalCredentials;
        bytes signature;
        bytes32 depositDataRoot;
        uint32[] operatorIds;
        bytes[] sharesPublicKeys;
        bytes[] sharesEncrypted;
    }

    bytes32 public constant MANAGER_ROLE = keccak256("Manager");

    StakeStarRegistry public stakeStarRegistry;
    StakeStarETH public stakeStarETH;
    StakeStarRewards public stakeStarRewards;

    IDepositContract public depositContract;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;

    mapping(address => uint256) public pendingUnstake;
    uint256 public pendingUnstakeSum;

    uint256 public localPoolSize;

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

    function setLocalPoolSize(uint256 size) public onlyRole(DEFAULT_ADMIN_ROLE) {
        localPoolSize = size;
        emit SetLocalPoolSize(size);
    }

    receive() external payable {}

    function stake() public payable {
        require(msg.value > 0, "no eth transferred");
        stakeStarETH.mint(msg.sender, msg.value);
        emit Stake(msg.sender, msg.value);
    }

    function unstake(uint256 eth) public {
        require(pendingUnstake[msg.sender] == 0, "unstake already pending");

        pendingUnstake[msg.sender] = eth;
        pendingUnstakeSum = pendingUnstakeSum.add(eth);

        stakeStarETH.burn(msg.sender, eth);
        emit Unstake(msg.sender, eth);
    }

    function claim() public {
        require(pendingUnstake[msg.sender] > 0, "no pending unstake");

        uint256 eth = pendingUnstake[msg.sender];
        delete pendingUnstake[msg.sender];
        pendingUnstakeSum = pendingUnstakeSum.sub(eth);

        (bool status,) = msg.sender.call{value : eth}("");
        require(status, "failed to send Ether");
        emit Claim(msg.sender, eth);
    }

    function unstakeAndClaim(uint256 eth) public {
        unstake(eth);
        claim();
    }

    function createValidator(ValidatorParams calldata validatorParams, uint256 ssvDepositAmount) public onlyRole(MANAGER_ROLE) {
        require(validatorCreationAvailability(), "cannot create validator");

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
        emit CreateValidator(validatorParams, ssvDepositAmount);
    }

    function updateValidator(ValidatorParams calldata validatorParams, uint256 ssvDepositAmount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            stakeStarRegistry.validatorStatuses(validatorParams.publicKey) == StakeStarRegistry.ValidatorStatus.CREATED,
            "validator not created"
        );

        ssvToken.approve(address(ssvNetwork), ssvDepositAmount);
        ssvNetwork.updateValidator(
            validatorParams.publicKey,
            validatorParams.operatorIds,
            validatorParams.sharesPublicKeys,
            validatorParams.sharesEncrypted,
            ssvDepositAmount
        );
        emit UpdateValidator(validatorParams, ssvDepositAmount);
    }

    function step1(bytes memory publicKey) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            stakeStarRegistry.validatorStatuses(publicKey) == StakeStarRegistry.ValidatorStatus.CREATED,
            "validator not created"
        );

        ssvNetwork.removeValidator(publicKey);
    }

    function validatorCreationAvailability() public view returns (bool) {
        return address(this).balance >= uint256(32 ether).add(localPoolSize).add(pendingUnstakeSum);
    }

    function destroyValidator(bytes memory publicKey) public onlyRole(MANAGER_ROLE) {
        revert("not implemented");
        require(validatorDestructionAvailability(), "cannot destruct validator");

        stakeStarRegistry.destroyValidator(publicKey);
        emit DestroyValidator(publicKey);
    }

    // TODO: add local pool & double destroy prevention
    function validatorDestructionAvailability() public view returns (bool) {
        revert("not implemented");
    }

    function applyRewards() public {
        uint256 amount = address(stakeStarRewards).balance;
        require(amount > 0, "no rewards available");

        stakeStarRewards.pull();
        stakeStarETH.updateRate(amount, true);
        emit ApplyRewards(amount);
    }

    function applyPenalties(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount > 0, "cannot apply zero penalty");
        stakeStarETH.updateRate(amount, false);
        emit ApplyPenalties(amount);
    }
}
