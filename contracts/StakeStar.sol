// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

import "./interfaces/IStakingPool.sol";
import "./interfaces/IDepositContract.sol";
import "./interfaces/ISSVNetwork.sol";
import "./interfaces/IOracleNetwork.sol";

import "./StakeStarETH.sol";
import "./StakeStarRegistry.sol";
import "./StakeStarTreasury.sol";

import "./helpers/ETHReceiver.sol";
import "./helpers/Utils.sol";

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

    struct Snapshot {
        uint256 total_ETH;
        uint256 total_ssETH;
        uint256 timestamp;
    }

    event SetAddresses(
        address depositContract,
        address ssvNetwork,
        address ssvToken,
        address oracleNetwork,
        address stakeStarETH,
        address stakeStarRegistry,
        address stakeStarTreasury,
        address withdrawalAddress,
        address feeRecipient,
        address mevRecipient
    );
    event SetRateParameters(uint24 maxRateDeviation, bool rateDeviationCheck);
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
    event TreasuryPayback(uint256 ssETH, uint256 ETH);
    event CommitSnapshot(
        uint256 total_ETH,
        uint256 total_ssETH,
        uint256 timestamp,
        uint256 rate
    );

    StakeStarETH public stakeStarETH;
    StakeStarRegistry public stakeStarRegistry;
    StakeStarTreasury public stakeStarTreasury;

    ETHReceiver public withdrawalAddress;
    ETHReceiver public feeRecipient;
    ETHReceiver public mevRecipient;

    IDepositContract public depositContract;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;
    IOracleNetwork public oracleNetwork;

    mapping(address => uint256) public pendingUnstake;
    mapping(uint32 => address) public pendingUnstakeQueue;
    mapping(uint32 => uint32) public previous;
    mapping(uint32 => uint32) public next;

    uint256 public pendingUnstakeSum;

    uint32 public left;
    uint32 public right;
    uint32 public loopLimit;

    uint24 public maxRateDeviation;
    bool public rateDeviationCheck;

    // lpu - Local Pool Unstake
    uint256 public localPoolSize;
    uint256 public localPoolMaxSize;
    uint256 public lpuLimit;
    uint256 public lpuFrequencyLimit;
    mapping(address => uint256) public lpuHistory;

    Snapshot[2] public snapshots;

    receive() external payable {}

    function initialize() public initializer {
        left = 1;
        right = 1;
        loopLimit = 25;
        maxRateDeviation = 500;
        rateDeviationCheck = true;

        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address depositContractAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address oracleNetworkAddress,
        address stakeStarETHAddress,
        address stakeStarRegistryAddress,
        address stakeStarTreasuryAddress,
        address withdrawalCredentialsAddress,
        address feeRecipientAddress,
        address mevRecipientAddress
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        depositContract = IDepositContract(depositContractAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        ssvToken = IERC20(ssvTokenAddress);
        oracleNetwork = IOracleNetwork(oracleNetworkAddress);

        stakeStarETH = StakeStarETH(stakeStarETHAddress);
        stakeStarRegistry = StakeStarRegistry(stakeStarRegistryAddress);
        stakeStarTreasury = StakeStarTreasury(
            payable(stakeStarTreasuryAddress)
        );

        withdrawalAddress = ETHReceiver(payable(withdrawalCredentialsAddress));
        feeRecipient = ETHReceiver(payable(feeRecipientAddress));
        mevRecipient = ETHReceiver(payable(mevRecipientAddress));

        emit SetAddresses(
            depositContractAddress,
            ssvNetworkAddress,
            ssvTokenAddress,
            oracleNetworkAddress,
            stakeStarETHAddress,
            stakeStarRegistryAddress,
            stakeStarTreasuryAddress,
            withdrawalCredentialsAddress,
            feeRecipientAddress,
            mevRecipientAddress
        );
    }

    function setRateParameters(
        uint24 _maxRateDeviation,
        bool _rateDeviationCheck
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        require(
            _maxRateDeviation <= Utils.BASE,
            "maxRateDeviation must be in [0, 100_000]"
        );

        maxRateDeviation = _maxRateDeviation;
        rateDeviationCheck = _rateDeviationCheck;

        emit SetRateParameters(_maxRateDeviation, rateDeviationCheck);
    }

    function setLocalPoolParameters(
        uint256 _localPoolMaxSize,
        uint256 _lpuLimit,
        uint256 _lpuFrequencyLimit
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
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
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        loopLimit = _loopLimit;

        emit SetQueueParameters(_loopLimit);
    }

    function stake() public payable {
        require(msg.value > 0, "no eth transferred");

        uint256 ssETH = ETH_to_ssETH(msg.value);
        stakeStarETH.mint(msg.sender, ssETH);

        uint256 treasury_ssETH = stakeStarETH.balanceOf(
            address(stakeStarTreasury)
        );
        if (treasury_ssETH > 0) {
            uint256 toBurn = treasury_ssETH > ssETH ? ssETH : treasury_ssETH;
            uint256 toTransfer = ssETH_to_ETH(toBurn);
            stakeStarETH.burn(address(stakeStarTreasury), toBurn);
            Utils.safeTransferETH(address(stakeStarTreasury), toTransfer);

            emit TreasuryPayback(toBurn, toTransfer);
        }

        localPoolSize = localPoolSize + msg.value > localPoolMaxSize
            ? localPoolMaxSize
            : localPoolSize + msg.value;

        emit Stake(msg.sender, msg.value, ssETH);
    }

    function unstake(uint256 ssETH) public returns (uint256 eth) {
        require(pendingUnstake[msg.sender] == 0, "one unstake at a time only");

        stakeStarETH.burn(msg.sender, ssETH);
        eth = ssETH_to_ETH(ssETH);

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

        Utils.safeTransferETH(msg.sender, eth);

        emit Claim(msg.sender, eth);
    }

    function localPoolUnstake(uint256 ssETH) public {
        uint256 eth = ssETH_to_ETH(ssETH);

        require(eth <= lpuLimit, "localPoolUnstakeLimit");
        require(eth <= localPoolSize, "localPoolSize");
        require(
            block.number - lpuHistory[msg.sender] > lpuFrequencyLimit,
            "lpuFrequencyLimit"
        );

        stakeStarETH.burn(msg.sender, ssETH);
        localPoolSize -= eth;
        lpuHistory[msg.sender] = block.number;

        Utils.safeTransferETH(msg.sender, eth);

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

    function reactivateAccount() public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        ssvNetwork.reactivateAccount(0);
    }

    function createValidator(
        ValidatorParams calldata validatorParams,
        uint256 ssvDepositAmount
    ) public onlyRole(Utils.MANAGER_ROLE) {
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
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
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
    ) public onlyRole(Utils.MANAGER_ROLE) {
        stakeStarRegistry.confirmExitingValidator(publicKey);
        ssvNetwork.removeValidator(publicKey);

        emit DestroyValidator(publicKey);
    }

    function harvest() public {
        if (address(feeRecipient).balance > 0) feeRecipient.pull();
        if (address(mevRecipient).balance > 0) mevRecipient.pull();
    }

    function commitSnapshot() public {
        (uint256 totalBalance, uint256 timestamp) = oracleNetwork
            .latestTotalBalance();

        require(
            timestamp >= snapshots[1].timestamp + Utils.EPOCH_DURATION,
            "timestamps too close"
        );

        harvest();

        uint256 total_ETH = totalBalance +
            address(this).balance -
            pendingUnstakeSum;
        uint256 total_ssETH = stakeStarETH.totalSupply();

        require(total_ETH > 0 && total_ssETH > 0, "totals must be > 0");

        uint256 currentRate = MathUpgradeable.mulDiv(
            total_ETH,
            1 ether,
            total_ssETH
        );

        if (snapshots[1].timestamp > 0) {
            uint256 lastRate = MathUpgradeable.mulDiv(
                snapshots[1].total_ETH,
                1 ether,
                snapshots[1].total_ssETH
            );

            uint256 maxRate = MathUpgradeable.max(currentRate, lastRate);
            uint256 minRate = MathUpgradeable.min(currentRate, lastRate);

            if (rateDeviationCheck) {
                require(
                    MathUpgradeable.mulDiv(
                        maxRate - minRate,
                        Utils.BASE,
                        maxRate
                    ) <= uint256(maxRateDeviation),
                    "rate deviation too big"
                );
            } else {
                rateDeviationCheck = true;
            }
        }

        snapshots[0] = snapshots[1];
        snapshots[1] = Snapshot(total_ETH, total_ssETH, timestamp);

        withdrawalAddress.pull();

        emit CommitSnapshot(total_ETH, total_ssETH, timestamp, currentRate);
    }

    function validatorCreationAvailability() public view returns (bool) {
        return
            address(this).balance >=
            (uint256(32 ether) + pendingUnstakeSum + localPoolSize);
    }

    function validatorDestructionAvailability() public view returns (bool) {
        uint256 activeValidators = stakeStarRegistry.countValidatorPublicKeys(
            StakeStarRegistry.ValidatorStatus.ACTIVE
        );
        if (activeValidators == 0) return false;

        uint256 freeETH = address(this).balance - localPoolSize;
        uint256 exitedETH = address(withdrawalAddress).balance;
        uint256 fees = address(feeRecipient).balance +
            address(mevRecipient).balance;
        uint256 exitingValidators = stakeStarRegistry.countValidatorPublicKeys(
            StakeStarRegistry.ValidatorStatus.EXITING
        );
        uint256 exitingETH = exitingValidators * uint256(32 ether);

        return
            pendingUnstakeSum >=
            uint256(16 ether) + freeETH + exitedETH + fees + exitingETH;
    }

    function validatorToDestroy() public view returns (bytes memory) {
        require(validatorDestructionAvailability(), "destroy not available");

        return
            stakeStarRegistry.getValidatorPublicKeys(
                StakeStarRegistry.ValidatorStatus.ACTIVE
            )[0];
    }

    function rate(uint256 timestamp) public view returns (uint256) {
        require(timestamp >= snapshots[1].timestamp, "timestamp from the past");

        if (snapshots[0].timestamp == 0 && snapshots[1].timestamp == 0) {
            return 1 ether;
        }

        uint256 rate1 = MathUpgradeable.mulDiv(
            snapshots[1].total_ETH,
            1 ether,
            snapshots[1].total_ssETH
        );

        if (snapshots[0].timestamp == 0) {
            return rate1;
        }

        uint256 rate0 = MathUpgradeable.mulDiv(
            snapshots[0].total_ETH,
            1 ether,
            snapshots[0].total_ssETH
        );

        if (rate1 > rate0) {
            return
                rate1 +
                MathUpgradeable.mulDiv(
                    rate1 - rate0,
                    timestamp - snapshots[1].timestamp,
                    snapshots[1].timestamp - snapshots[0].timestamp
                );
        } else {
            return
                rate1 -
                MathUpgradeable.mulDiv(
                    rate0 - rate1,
                    timestamp - snapshots[1].timestamp,
                    snapshots[1].timestamp - snapshots[0].timestamp
                );
        }
    }

    function rate() public view returns (uint256) {
        return rate(block.timestamp);
    }

    function ssETH_to_ETH(uint256 ssETH) public view returns (uint256) {
        return MathUpgradeable.mulDiv(ssETH, rate(block.timestamp), 1 ether);
    }

    function ETH_to_ssETH(uint256 eth) public view returns (uint256) {
        return MathUpgradeable.mulDiv(eth, 1 ether, rate(block.timestamp));
    }
}
