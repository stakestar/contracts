// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./IStakingPool.sol";
import "./StakeStarRegistry.sol";
import "./StakeStarETH.sol";
import "./StakeStarRewards.sol";
import "./StakeStarTreasury.sol";

import "./IDepositContract.sol";
import "./ISSVNetwork.sol";

// TODO Maintain SSV position in SSVNetwork contract
// TODO Create validator destruction conditions
// TODO Prevent double validator destroy
// TODO Add local pool filling on validator destroy
contract StakeStar is IStakingPool, Initializable, AccessControlUpgradeable {
    using SafeMath for uint256;

    event SetAddresses(
        address depositContractAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address stakeStarRegistryAddress,
        address stakeStarETHAddress,
        address stakeStarRewardsAddress,
        address stakeStarTreasuryAddress
    );
    event SetLocalPoolSize(uint256 size);
    event CreateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event UpdateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event DestroyValidator(bytes publicKey);
    event Stake(address indexed who, uint256 amount);
    event Unstake(address indexed who, uint256 amount);
    event Claim(address indexed who, uint256 amount);
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
    StakeStarTreasury public stakeStarTreasury;

    IDepositContract public depositContract;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;

    mapping(address => uint256) public pendingUnstake;
    uint256 public pendingUnstakeSum;

    uint256 public localPoolSize;

    int256 public previous_staking_reward_balance1;
    uint256 public previous_staking_reward_balance_timestamp1;

    int256 public previous_staking_reward_balance2;
    uint256 public previous_staking_reward_balance_timestamp2;

    uint256 constant minimum_staking_reward_time_distance = 180;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address depositContractAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address stakeStarRegistryAddress,
        address stakeStarETHAddress,
        address stakeStarRewardsAddress,
        address stakeStarTreasuryAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        depositContract = IDepositContract(depositContractAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvTokenAddress);

        stakeStarRegistry = StakeStarRegistry(stakeStarRegistryAddress);
        stakeStarETH = StakeStarETH(stakeStarETHAddress);
        stakeStarRewards = StakeStarRewards(payable(stakeStarRewardsAddress));
        stakeStarTreasury = StakeStarTreasury(payable(stakeStarTreasuryAddress));

        emit SetAddresses(
            depositContractAddress,
            ssvNetworkAddress,
            ssvTokenAddress,
            stakeStarRegistryAddress,
            stakeStarETHAddress,
            stakeStarRewardsAddress,
            stakeStarTreasuryAddress
        );
    }

    function setLocalPoolSize(uint256 size) public onlyRole(DEFAULT_ADMIN_ROLE) {
        localPoolSize = size;
        emit SetLocalPoolSize(size);
    }

    receive() external payable {}

    function stake() public payable {
        require(msg.value > 0, "no eth transferred");

        uint256 ssETH = ETH_to_ssETH_approximate(msg.value);
        stakeStarETH.mint(msg.sender, ssETH);

        emit Stake(msg.sender, msg.value);
    }

    function unstake(uint256 ssETH) public returns (uint256 unstakedEth) {
        stakeStarETH.burn(msg.sender, ssETH);

        unstakedEth = ssETH_to_ETH_approximate(ssETH);
        pendingUnstake[msg.sender] += unstakedEth;
        pendingUnstakeSum += unstakedEth;

        emit Unstake(msg.sender, unstakedEth);
    }

    function claim() public {
        require(pendingUnstake[msg.sender] > 0, "no pending unstake");

        uint256 claimedEth = pendingUnstake[msg.sender];
        delete pendingUnstake[msg.sender];
        pendingUnstakeSum -= claimedEth;

        (bool status,) = msg.sender.call{value : claimedEth}("");
        require(status, "failed to send Ether");
        emit Claim(msg.sender, claimedEth);
    }

    function unstakeAndClaim(uint256 ssETH) public {
        unstake(ssETH);
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

    function validatorCreationAvailability() public view returns (bool) {
        return address(this).balance >= (uint256(32 ether) + localPoolSize + pendingUnstakeSum);
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

    function applyConsensusRewards(int256 current_total_staking_reward_balance,
                                   uint256 timestamp) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(timestamp >= previous_staking_reward_balance_timestamp2 + minimum_staking_reward_time_distance,
                "small timestamp distance");

        bool point1_was_init = previous_staking_reward_balance_timestamp1 != 0;
        bool point2_was_init = previous_staking_reward_balance_timestamp2 != 0;

        previous_staking_reward_balance1 = previous_staking_reward_balance2;
        previous_staking_reward_balance_timestamp1 = previous_staking_reward_balance_timestamp2;

        previous_staking_reward_balance2 = current_total_staking_reward_balance;
        previous_staking_reward_balance_timestamp2 = timestamp;

        if (point2_was_init) {
            if (!point1_was_init) {  // first time init
                stakeStarETH.updateRate(current_total_staking_reward_balance);
            } else {
                int256 balance_change = previous_staking_reward_balance2 - previous_staking_reward_balance1;
                stakeStarETH.updateRate(balance_change);
            }
        }
    }

    function getApproximateConsensusReward(uint256 timestamp) public view returns (int256) {
        if (previous_staking_reward_balance_timestamp1 == 0) {  // not initialized yet or initialized only one point
            return 0;
        }

        require(previous_staking_reward_balance_timestamp1 + minimum_staking_reward_time_distance
            <= previous_staking_reward_balance_timestamp2, "invalid timestamp distance");

        require(previous_staking_reward_balance_timestamp2 <= timestamp, "timestamp in past");

        if (previous_staking_reward_balance_timestamp2 == timestamp) {
            return previous_staking_reward_balance2;
        }

        return (previous_staking_reward_balance2 - previous_staking_reward_balance1)
                    * (int256(timestamp) - int256(previous_staking_reward_balance_timestamp2))
                    / (int256(previous_staking_reward_balance_timestamp2) -
                       int256(previous_staking_reward_balance_timestamp1))
                + previous_staking_reward_balance2;
    }

    function getApproximateRate(uint256 timestamp) public view returns (uint256) {
        if (previous_staking_reward_balance_timestamp1 == 0) {  // not initialized yet or initialized only one point
            return stakeStarETH.rate();
        }

        int256 approximateReward = getApproximateConsensusReward(timestamp);
        int256 approximateEthChange = approximateReward - previous_staking_reward_balance2;

        return stakeStarETH.rateAfterUpdate(approximateEthChange);
    }

    function currentApproximateRate() public view returns (uint256) {
        return getApproximateRate(block.timestamp);
    }

    function ssETH_to_ETH_approximate(uint256 ssETH) public view returns (uint256) {
        return ssETH * currentApproximateRate() / 1 ether;
    }

    function ETH_to_ssETH_approximate(uint256 eth) public view returns (uint256) {
        return eth * 1 ether / currentApproximateRate();
    }


    function applyRewards() public {
        uint256 amount = address(stakeStarRewards).balance;
        require(amount > 0, "no rewards available");
        stakeStarRewards.pull();

        uint256 treasuryCommission = stakeStarTreasury.commission(amount);
        payable(stakeStarTreasury).transfer(treasuryCommission);

        uint256 rewards = amount - treasuryCommission;
        stakeStarETH.updateRate(int256(rewards));
        emit ApplyRewards(rewards);
    }

    function applyPenalties(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount > 0, "cannot apply zero penalty");
        stakeStarETH.updateRate(-int256(amount));
        emit ApplyPenalties(amount);
    }
}
