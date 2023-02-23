// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/IConsensusDataProvider.sol";
import "./interfaces/IDepositContract.sol";
import "./interfaces/ISSVNetwork.sol";
import "./interfaces/IStakingPool.sol";

import "./StakeStarRegistry.sol";
import "./StakeStarETH.sol";
import "./StakeStarRewards.sol";
import "./StakeStarTreasury.sol";

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

    event SetAddresses(
        address depositContractAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address consensusDataProviderAddress,
        address stakeStarRegistryAddress,
        address stakeStarETHAddress,
        address stakeStarRewardsAddress,
        address stakeStarTreasuryAddress
    );
    event SetLocalPoolParameters(
        uint256 localPoolMaxSize,
        uint256 lpuLimit,
        uint256 lpuFrequencyLimit
    );
    event SetQueueParameters(uint32 loopLimit);
    event CreateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event UpdateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event DestroyValidator(bytes publicKey);
    event Stake(address indexed who, uint256 eth, uint256 ssETH);
    event Unstake(address indexed who, uint256 eth, uint256 ssETH);
    event Claim(address indexed who, uint256 amount);
    event LocalPoolUnstake(address indexed who, uint256 eth, uint256 ssETH);
    event Harvest(uint256 amount);
    event CommitStakingSurplus(int256 stakingSurplus, uint256 timestamp);

    bytes32 public constant MANAGER_ROLE = keccak256("Manager");

    StakeStarRegistry public stakeStarRegistry;
    StakeStarETH public stakeStarETH;
    StakeStarRewards public stakeStarRewards;
    StakeStarTreasury public stakeStarTreasury;

    IDepositContract public depositContract;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;

    IConsensusDataProvider public consensusDataProvider;

    mapping(address => uint256) public pendingUnstake;
    mapping(uint32 => address) public pendingUnstakeQueue;
    mapping(uint32 => uint32) public previous;
    mapping(uint32 => uint32) public next;

    uint256 public pendingUnstakeSum;

    uint32 public left;
    uint32 public right;
    uint32 public loopLimit;

    int256 public stakingSurplusA;
    int256 public stakingSurplusB;
    uint256 public timestampA;
    uint256 public timestampB;
    uint256 public constant MIN_TIMESTAMP_DISTANCE = 180;

    // lpu - Local Pool Unstake
    uint256 public localPoolSize;
    uint256 public localPoolMaxSize;
    uint256 public lpuLimit;
    uint256 public lpuFrequencyLimit;
    mapping(address => uint256) public lpuHistory;

    uint256 public reservedTreasuryCommission;

    receive() external payable {}

    function initialize() public initializer {
        left = 1;
        right = 1;
        loopLimit = 25;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address depositContractAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address consensusDataProviderAddress,
        address stakeStarRegistryAddress,
        address stakeStarETHAddress,
        address stakeStarRewardsAddress,
        address stakeStarTreasuryAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        depositContract = IDepositContract(depositContractAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvTokenAddress);

        consensusDataProvider = IConsensusDataProvider(
            consensusDataProviderAddress
        );

        stakeStarRegistry = StakeStarRegistry(stakeStarRegistryAddress);
        stakeStarETH = StakeStarETH(stakeStarETHAddress);
        stakeStarRewards = StakeStarRewards(payable(stakeStarRewardsAddress));
        stakeStarTreasury = StakeStarTreasury(
            payable(stakeStarTreasuryAddress)
        );

        emit SetAddresses(
            depositContractAddress,
            ssvNetworkAddress,
            ssvTokenAddress,
            consensusDataProviderAddress,
            stakeStarRegistryAddress,
            stakeStarETHAddress,
            stakeStarRewardsAddress,
            stakeStarTreasuryAddress
        );
    }

    function setLocalPoolParameters(
        uint256 _localPoolMaxSize,
        uint256 _lpuLimit,
        uint256 _lpuFrequencyLimit
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        localPoolMaxSize = _localPoolMaxSize;
        lpuLimit = _lpuLimit;
        lpuFrequencyLimit = _lpuFrequencyLimit;

        emit SetLocalPoolParameters(
            _localPoolMaxSize,
            _lpuLimit,
            _lpuFrequencyLimit
        );
    }

    function setQueueParameters(
        uint32 _loopLimit
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        loopLimit = _loopLimit;

        emit SetQueueParameters(_loopLimit);
    }

    function stake() public payable {
        require(msg.value > 0, "no eth transferred");

        uint256 ssETH = ETH_to_ssETH_approximate(msg.value);
        stakeStarETH.mint(msg.sender, ssETH);

        localPoolSize = localPoolSize + msg.value > localPoolMaxSize
            ? localPoolMaxSize
            : localPoolSize + msg.value;

        emit Stake(msg.sender, msg.value, ssETH);
    }

    function unstake(uint256 ssETH) public returns (uint256 eth) {
        require(pendingUnstake[msg.sender] == 0, "one unstake at a time only");

        stakeStarETH.burn(msg.sender, ssETH);
        eth = ssETH_to_ETH_approximate(ssETH);

        pendingUnstake[msg.sender] = eth;
        pendingUnstakeSum += eth;
        pendingUnstakeQueue[right] = msg.sender;
        previous[right + 1] = right;
        next[right] = right + 1;
        right++;

        emit Unstake(msg.sender, eth, ssETH);
    }

    function claim() public {
        require(pendingUnstake[msg.sender] > 0, "no pending unstake");

        uint32 index = queueIndex(msg.sender);
        require(index > 0, "lack of eth / queue length");

        uint256 eth = pendingUnstake[msg.sender];
        pendingUnstakeSum -= eth;
        previous[next[index]] = previous[index];
        next[previous[index]] = next[index];

        if (left == index) left = next[left];

        delete pendingUnstake[msg.sender];
        delete pendingUnstakeQueue[index];
        delete previous[index];
        delete next[index];

        (bool status, ) = msg.sender.call{value: eth}("");
        require(status, "failed to send Ether");

        emit Claim(msg.sender, eth);
    }

    function localPoolUnstake(uint256 ssETH) public {
        uint256 eth = ssETH_to_ETH_approximate(ssETH);

        require(eth <= lpuLimit, "localPoolUnstakeLimit");
        require(eth <= localPoolSize, "localPoolSize");
        require(
            block.number - lpuHistory[msg.sender] > lpuFrequencyLimit,
            "lpuFrequencyLimit"
        );

        stakeStarETH.burn(msg.sender, ssETH);
        localPoolSize -= eth;
        lpuHistory[msg.sender] = block.number;

        (bool status, ) = msg.sender.call{value: eth}("");
        require(status, "failed to send Ether");

        emit LocalPoolUnstake(msg.sender, eth, ssETH);
    }

    function queueIndex(address msgSender) public view returns (uint32) {
        uint32 index = left;
        uint32 loopCounter = 0;
        uint256 availableETH = address(this).balance - localPoolSize;
        uint256 unstakeSum = 0;

        while (index < right && loopCounter < loopLimit) {
            unstakeSum += pendingUnstake[pendingUnstakeQueue[index]];
            if (unstakeSum > availableETH) break;
            if (msgSender == pendingUnstakeQueue[index]) return index;
            index = next[index];
            loopCounter++;
        }

        return 0;
    }

    function reactivateAccount() public onlyRole(DEFAULT_ADMIN_ROLE) {
        ssvNetwork.reactivateAccount(0);
    }

    function createValidator(
        ValidatorParams calldata validatorParams,
        uint256 ssvDepositAmount
    ) public onlyRole(MANAGER_ROLE) {
        require(validatorCreationAvailability(), "cannot create validator");
        require(
            stakeStarRegistry.verifyOperators(validatorParams.operatorIds),
            "operators not allowListed"
        );

        stakeStarRegistry.initiateActivatingValidator(
            validatorParams.publicKey
        );

        depositContract.deposit{value: 32 ether}(
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

    function updateValidator(
        ValidatorParams calldata validatorParams,
        uint256 ssvDepositAmount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            stakeStarRegistry.validatorStatuses(validatorParams.publicKey) !=
                StakeStarRegistry.ValidatorStatus.MISSING,
            "validator missing"
        );
        require(
            stakeStarRegistry.verifyOperators(validatorParams.operatorIds),
            "operators not allowListed"
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

    function destroyValidator(
        bytes memory publicKey
    ) public onlyRole(MANAGER_ROLE) {
        stakeStarRegistry.confirmExitingValidator(publicKey);
        ssvNetwork.removeValidator(publicKey);

        emit DestroyValidator(publicKey);
    }

    function harvest() public {
        uint256 amount = address(stakeStarRewards).balance;
        require(amount > 0, "no rewards available");
        stakeStarRewards.pull();

        uint256 treasuryCommission = stakeStarTreasury.commission(
            int256(amount)
        );
        (bool status, ) = payable(stakeStarTreasury).call{
            value: treasuryCommission
        }("");
        require(status, "failed to send Ether");

        uint256 rewards = amount - treasuryCommission;
        stakeStarETH.updateRate(int256(rewards));

        localPoolSize = localPoolSize + amount > localPoolMaxSize
            ? localPoolMaxSize
            : localPoolSize + amount;

        emit Harvest(rewards);
    }

    function commitStakingSurplus() public {
        (int256 latestStakingSurplus, uint256 timestamp) = consensusDataProvider
            .latestStakingSurplus();

        require(
            timestamp >= timestampB + MIN_TIMESTAMP_DISTANCE,
            "timestamp distance too short"
        );

        bool initialized = approximationDataInitialized();

        stakingSurplusA = stakingSurplusB;
        timestampA = timestampB;

        reservedTreasuryCommission = stakeStarTreasury.commission(
            latestStakingSurplus
        );
        stakingSurplusB =
            latestStakingSurplus -
            int256(reservedTreasuryCommission);
        timestampB = timestamp;

        if (approximationDataInitialized()) {
            if (initialized) {
                int256 ethChange = stakingSurplusB - stakingSurplusA;
                stakeStarETH.updateRate(ethChange);
            } else {
                stakeStarETH.updateRate(stakingSurplusB);
            }
        }

        emit CommitStakingSurplus(stakingSurplusB, timestampB);
    }

    function validatorCreationAvailability() public view returns (bool) {
        return
            address(this).balance >=
            (uint256(32 ether) +
                localPoolMaxSize -
                localPoolSize +
                pendingUnstakeSum);
    }

    function validatorDestructionAvailability() public view returns (bool) {
        uint256 activeValidators = stakeStarRegistry.countValidatorPublicKeys(
            StakeStarRegistry.ValidatorStatus.ACTIVE
        );
        if (activeValidators == 0) return false;

        uint256 exitingValidators = stakeStarRegistry.countValidatorPublicKeys(
            StakeStarRegistry.ValidatorStatus.EXITING
        );
        uint256 exitingETH = exitingValidators * uint256(32 ether);
        uint256 exitedETH = address(this).balance +
            address(stakeStarRewards).balance;

        return
            pendingUnstakeSum >=
            uint256(32 ether) +
                exitingETH +
                exitedETH +
                localPoolMaxSize -
                localPoolSize;
    }

    function validatorToDestroy() public view returns (bytes memory) {
        if (validatorDestructionAvailability())
            return
                stakeStarRegistry.getValidatorPublicKeys(
                    StakeStarRegistry.ValidatorStatus.ACTIVE
                )[0];
        else return "";
    }

    function approximateStakingSurplus(
        uint256 timestamp
    ) public view returns (int256) {
        require(timestampA * timestampB > 0, "point A or B not initialized");
        require(
            timestampA + MIN_TIMESTAMP_DISTANCE <= timestampB,
            "timestamp distance too short"
        );
        require(timestampB <= timestamp, "timestamp in the past");

        if (timestampB == timestamp) return stakingSurplusB;

        return
            ((stakingSurplusB - stakingSurplusA) *
                (int256(timestamp) - int256(timestampB))) /
            (int256(timestampB) - int256(timestampA)) +
            stakingSurplusB;
    }

    function approximateRate(uint256 timestamp) public view returns (uint256) {
        if (approximationDataInitialized()) {
            int256 approxStakingSurplus = approximateStakingSurplus(timestamp);
            int256 approxEthChange = approxStakingSurplus - stakingSurplusB;
            return stakeStarETH.estimateRate(approxEthChange);
        } else {
            return stakeStarETH.rate();
        }
    }

    function approximationDataInitialized() public view returns (bool) {
        return timestampA != 0 && timestampB != 0;
    }

    function currentApproximateRate() public view returns (uint256) {
        return approximateRate(block.timestamp);
    }

    function ssETH_to_ETH_approximate(
        uint256 ssETH
    ) public view returns (uint256) {
        return (ssETH * currentApproximateRate()) / 1 ether;
    }

    function ETH_to_ssETH_approximate(
        uint256 eth
    ) public view returns (uint256) {
        return (eth * 1 ether) / currentApproximateRate();
    }
}
