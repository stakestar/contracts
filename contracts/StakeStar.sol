// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

import "./helpers/ETHReceiver.sol";
import "./helpers/Utils.sol";

import "./interfaces/IStakingPool.sol";
import "./interfaces/IDepositContract.sol";
import "./interfaces/IOracleNetwork.sol";

import "./ssv-network/ISSVNetwork.sol";

import "./tokens/SStarETH.sol";
import "./tokens/StarETH.sol";

import "./StakeStarRegistry.sol";
import "./StakeStarTreasury.sol";

contract StakeStar is IStakingPool, Initializable, AccessControlUpgradeable {
    struct ValidatorParams {
        bytes publicKey;
        bytes withdrawalCredentials;
        bytes signature;
        bytes32 depositDataRoot;
        uint64[] operatorIds;
        bytes sharesEncrypted;
    }

    struct Snapshot {
        uint96 total_ETH;
        uint96 total_stakedStar;
        uint64 timestamp;
    }

    event SetAddresses(
        address depositContract,
        address ssvNetwork,
        address ssvToken,
        address oracleNetwork,
        address sstarETH,
        address starETH,
        address stakeStarRegistry,
        address stakeStarTreasury,
        address withdrawalAddress,
        address feeRecipient,
        address mevRecipient
    );
    event SetRateParameters(uint24 maxRateDeviation, bool rateDeviationCheck);
    event SetLocalPoolParameters(
        uint256 localPoolMaxSize,
        uint256 limit,
        uint256 frequencyLimit
    );
    event SetQueueParameters(uint32 loopLimit);
    event SetCommissionParameters(uint256 rateDiffThreshold);
    event SetValidatorWithdrawalThreshold(uint256 threshold);
    event CreateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event UpdateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event DestroyValidator(bytes publicKey);
    event RegisterValidator(ValidatorParams params);
    event UnregisterValidator(bytes publicKey);
    event Deposit(address indexed who, uint256 eth);
    event Stake(address indexed who, uint256 starETH, uint256 sstarETH);
    event Unstake(address indexed who, uint256 sstarETH, uint256 starETH);
    event Withdraw(address indexed who, uint256 starETH);
    event Claim(address indexed who, uint256 eth);
    event LocalPoolWithdraw(address indexed who, uint256 starETH);
    event CommitSnapshot(
        uint256 total_ETH,
        uint256 total_stakedStar,
        uint256 timestamp,
        uint256 rate
    );
    event RateDiff(uint256 realRate, uint256 calculatedRate);
    event RateEC(uint256 rateEC);
    event ExtractCommission(uint256 ssETH);
    event OptimizeCapitalEfficiency(uint256 ssETH, uint256 eth);

    SStarETH public sstarETH;
    StarETH public starETH;
    StakeStarRegistry public stakeStarRegistry;
    StakeStarTreasury public stakeStarTreasury;

    ETHReceiver public withdrawalAddress;
    ETHReceiver public feeRecipient;
    ETHReceiver public mevRecipient;

    IDepositContract public depositContract;
    ISSVNetwork public ssvNetwork;
    IERC20 public ssvToken;
    IOracleNetwork public oracleNetwork;

    mapping(address => uint256) public pendingWithdrawal;
    mapping(uint32 => address) public pendingWithdrawalQueue;
    mapping(uint32 => uint32) public next;

    uint256 public pendingWithdrawalSum;

    uint32 public head;
    uint32 public tail;
    uint32 public loopLimit;

    uint24 public maxRateDeviation;
    bool public rateDeviationCheck;

    uint256 public localPoolSize;
    uint256 public localPoolMaxSize;
    uint256 public localPoolWithdrawalLimit;
    uint256 public localPoolWithdrawalFrequencyLimit;
    mapping(address => uint256) public localPoolWithdrawalHistory;

    Snapshot[2] public snapshots;

    uint256 public validatorWithdrawalThreshold;

    uint256 public rateForExtractCommision;
    uint256 public rateCorrectionFactor;
    uint256 public rateDiffThreshold;

    receive() external payable {}

    function initialize() public initializer {
        head = 1;
        tail = 1;
        loopLimit = 25;

        maxRateDeviation = 500;  // 0.5%
        rateDeviationCheck = true;

        rateForExtractCommision = 1 ether;
        rateCorrectionFactor = 1 ether;

        validatorWithdrawalThreshold = 16 ether;

        _setupRole(Utils.DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setAddresses(
        address depositContractAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address oracleNetworkAddress,
        address sstarETHAddress,
        address starETHAddress,
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

        sstarETH = SStarETH(sstarETHAddress);
        starETH = StarETH(starETHAddress);
        stakeStarRegistry = StakeStarRegistry(stakeStarRegistryAddress);
        stakeStarTreasury = StakeStarTreasury(
            payable(stakeStarTreasuryAddress)
        );

        withdrawalAddress = ETHReceiver(payable(withdrawalCredentialsAddress));
        feeRecipient = ETHReceiver(payable(feeRecipientAddress));
        mevRecipient = ETHReceiver(payable(mevRecipientAddress));

        ssvNetwork.setFeeRecipientAddress(feeRecipientAddress);

        emit SetAddresses(
            depositContractAddress,
            ssvNetworkAddress,
            ssvTokenAddress,
            oracleNetworkAddress,
            sstarETHAddress,
            starETHAddress,
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
        uint256 _localPoolWithdrawalLimit,
        uint256 _localPoolWithdrawalFrequencyLimit
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        localPoolMaxSize = _localPoolMaxSize;
        localPoolWithdrawalLimit = _localPoolWithdrawalLimit;
        localPoolWithdrawalFrequencyLimit = _localPoolWithdrawalFrequencyLimit;

        localPoolSize = MathUpgradeable.min(localPoolSize, localPoolMaxSize);

        emit SetLocalPoolParameters(
            _localPoolMaxSize,
            _localPoolWithdrawalLimit,
            _localPoolWithdrawalFrequencyLimit
        );
    }

    function setQueueParameters(
        uint32 _loopLimit
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        loopLimit = _loopLimit;

        emit SetQueueParameters(_loopLimit);
    }

    function setCommissionParameters(
        uint256 _rateDiffThreshold
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        rateDiffThreshold = _rateDiffThreshold;

        emit SetCommissionParameters(_rateDiffThreshold);
    }

    function setValidatorWithdrawalThreshold(
        uint256 threshold
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        validatorWithdrawalThreshold = threshold;

        emit SetValidatorWithdrawalThreshold(threshold);
    }

    function deposit() public payable {
        require(msg.value > 0, "msg.value = 0");

        starETH.mint(msg.sender, msg.value);

        uint256 eth = optimizeCapitalEfficiency(msg.value);
        topUpLocalPool(msg.value - eth);

        emit Deposit(msg.sender, msg.value);
    }

    function stake(
        uint256 starAmount
    ) public returns (uint256 stakedStarAmount) {
        require(starAmount > 0, "amount = 0");
        extractCommission();

        stakedStarAmount = ETHToStakedStar(starAmount);
        starETH.burn(msg.sender, starAmount);
        sstarETH.mint(msg.sender, stakedStarAmount);

        emit Stake(msg.sender, starAmount, stakedStarAmount);
    }

    function depositAndStake() public payable {
        deposit();
        stake(msg.value);
    }

    function unstake(
        uint256 stakedStarAmount
    ) public returns (uint256 starAmount) {
        extractCommission();

        starAmount = stakedStarToETH(stakedStarAmount);
        sstarETH.burn(msg.sender, stakedStarAmount);
        starETH.mint(msg.sender, starAmount);

        emit Unstake(msg.sender, stakedStarAmount, starAmount);
    }

    function withdraw(uint256 starAmount) public {
        require(
            pendingWithdrawal[msg.sender] == 0,
            "one withdrawal at a time only"
        );
        starETH.burn(msg.sender, starAmount);

        pendingWithdrawal[msg.sender] = starAmount;
        pendingWithdrawalSum += starAmount;
        pendingWithdrawalQueue[tail] = msg.sender;
        next[tail] = tail + 1;
        tail++;

        emit Withdraw(msg.sender, starAmount);
    }

    function unstakeAndWithdraw(uint256 stakedStarAmount) public {
        uint256 starAmount = unstake(stakedStarAmount);
        withdraw(starAmount);
    }

    function claim() public {
        require(pendingWithdrawal[msg.sender] > 0, "no pending withdrawal");

        (uint32 index, uint32 index_prev) = queueIndexAndPrevious(msg.sender);
        require(index > 0, "lack of eth / queue length");

        uint256 eth = pendingWithdrawal[msg.sender];
        pendingWithdrawalSum -= eth;
        if (head == index) {
            head = next[head];
        } else {
            next[index_prev] = next[index];
        }

        delete pendingWithdrawal[msg.sender];
        delete pendingWithdrawalQueue[index];
        delete next[index];

        Utils.safeTransferETH(msg.sender, eth);

        emit Claim(msg.sender, eth);
    }

    function localPoolWithdraw(uint256 starAmount) public {
        require(
            starAmount <= localPoolWithdrawalLimit,
            "localPoolWithdrawalLimit"
        );
        require(starAmount <= localPoolSize, "localPoolSize");
        require(
            block.number - localPoolWithdrawalHistory[msg.sender] >
                localPoolWithdrawalFrequencyLimit,
            "localPoolWithdrawalFrequencyLimit"
        );

        starETH.burn(msg.sender, starAmount);
        localPoolSize -= starAmount;
        localPoolWithdrawalHistory[msg.sender] = block.number;

        Utils.safeTransferETH(msg.sender, starAmount);

        emit LocalPoolWithdraw(msg.sender, starAmount);
    }

    function unstakeAndLocalPoolWithdraw(uint256 stakedStarAmount) public {
        uint256 starAmount = unstake(stakedStarAmount);
        localPoolWithdraw(starAmount);
    }

    function queueIndexAndPrevious(address msgSender) public view returns (uint32, uint32) {
        uint32 index = head;
        uint32 index_previous = 0;

        uint32 loopCounter = 0;
        uint256 availableETH = address(this).balance - localPoolSize;
        uint256 withdrawalSum = 0;

        while (index < tail && loopCounter < loopLimit) {
            withdrawalSum += pendingWithdrawal[pendingWithdrawalQueue[index]];
            if (withdrawalSum > availableETH) break;
            if (msgSender == pendingWithdrawalQueue[index]) return (index, index_previous);

            index_previous = index;
            index = next[index];
            loopCounter++;
        }

        return (0, 0);
    }

    function queueIndex(address msgSender) public view returns (uint32) {
        (uint32 index, ) = queueIndexAndPrevious(msgSender);
        return index;
    }

    function extractCommission() public {
        uint256 totalSupply_stakedStar = sstarETH.totalSupply();
        if (totalSupply_stakedStar == 0) return;
        uint256 totalSupply_ETH = stakedStarToETH(totalSupply_stakedStar);

        uint256 currentRate = rate();
        if (currentRate > rateForExtractCommision) {
            if (currentRate <= rateForExtractCommision + rateDiffThreshold) return;

            uint256 unrecordedRewards = MathUpgradeable.mulDiv(
                totalSupply_stakedStar,
                currentRate - rateForExtractCommision,
                1 ether
            );
            uint256 commission_ETH = stakeStarTreasury.getCommission(
                unrecordedRewards
            );
            uint256 commission_stakedStar = MathUpgradeable.mulDiv(
                commission_ETH,
                totalSupply_stakedStar,
                totalSupply_ETH - commission_ETH
            );

            rateCorrectionFactor = MathUpgradeable.mulDiv(
                rateCorrectionFactor,
                totalSupply_stakedStar,
                totalSupply_stakedStar + commission_stakedStar
            );
            sstarETH.mint(address(stakeStarTreasury), commission_stakedStar);

            emit ExtractCommission(commission_stakedStar);
        }

        rateForExtractCommision = rate();
        emit RateEC(rateForExtractCommision);
    }

    function optimizeCapitalEfficiency(uint256 eth) internal returns (uint256) {
        uint256 stakedStarBalance = sstarETH.balanceOf(
            address(stakeStarTreasury)
        );
        uint256 ethBalance = stakedStarToETH(stakedStarBalance);

        uint256 toTransfer = MathUpgradeable.min(eth, ethBalance);
        uint256 toBurn = ETHToStakedStar(toTransfer);

        if (toTransfer > 0 && toBurn > 0) {
            sstarETH.burn(address(stakeStarTreasury), toBurn);
            Utils.safeTransferETH(address(stakeStarTreasury), toTransfer);
            emit OptimizeCapitalEfficiency(toBurn, toTransfer);
        }

        return toTransfer;
    }

    function topUpLocalPool(uint256 value) internal {
        localPoolSize = MathUpgradeable.min(
            localPoolSize + value,
            localPoolMaxSize
        );
    }

    function reactivate(
        uint64[] memory operatorIds,
        uint256 amount,
        ISSVNetwork.Cluster memory cluster
    ) public onlyRole(Utils.DEFAULT_ADMIN_ROLE) {
        ssvNetwork.reactivate(operatorIds, amount, cluster);
    }

    function createValidator(
        ValidatorParams calldata validatorParams,
        uint256 amount,
        ISSVNetwork.Cluster calldata cluster
    ) public onlyRole(Utils.MANAGER_ROLE) {
        require(validatorCreationAvailability(), "cannot create validator");
        require(
            stakeStarRegistry.verifyOperators(validatorParams.operatorIds),
            "operators not allowListed"
        );
        require(
            Utils.compareBytes(
                validatorParams.withdrawalCredentials,
                Utils.addressToWithdrawalCredentials(address(withdrawalAddress))
            ),
            "invalid WC"
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

        ssvToken.approve(address(ssvNetwork), amount);
        ssvNetwork.registerValidator(
            validatorParams.publicKey,
            validatorParams.operatorIds,
            validatorParams.sharesEncrypted,
            amount,
            cluster
        );

        emit CreateValidator(validatorParams, amount);
    }

    function destroyValidator(
        bytes calldata publicKey,
        uint64[] memory operatorIds,
        ISSVNetwork.Cluster memory cluster
    ) public onlyRole(Utils.MANAGER_ROLE) {
        stakeStarRegistry.confirmExitingValidator(publicKey);
        ssvNetwork.removeValidator(publicKey, operatorIds, cluster);

        emit DestroyValidator(publicKey);
    }

    function registerValidator(
        ValidatorParams calldata validatorParams,
        uint256 amount,
        ISSVNetwork.Cluster calldata cluster
    ) public onlyRole(Utils.MANAGER_ROLE) {
        ssvToken.approve(address(ssvNetwork), amount);
        ssvNetwork.registerValidator(
            validatorParams.publicKey,
            validatorParams.operatorIds,
            validatorParams.sharesEncrypted,
            amount,
            cluster
        );

        emit RegisterValidator(validatorParams);
    }

    function unregisterValidator(
        bytes calldata publicKey,
        uint64[] memory operatorIds,
        ISSVNetwork.Cluster memory cluster
    ) public onlyRole(Utils.MANAGER_ROLE) {
        ssvNetwork.removeValidator(publicKey, operatorIds, cluster);

        emit UnregisterValidator(publicKey);
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
            pendingWithdrawalSum -
            starETH.totalSupply();
        uint256 total_stakedStar = sstarETH.totalSupply();

        require(total_ETH > 0 && total_stakedStar > 0, "totals must be > 0");

        uint256 currentRate = rate();
        uint256 newRate = MathUpgradeable.mulDiv(
            total_ETH,
            1 ether,
            total_stakedStar
        );

        if (rateDeviationCheck) {
            uint256 lastRate = snapshots[1].timestamp > 0
                ? MathUpgradeable.mulDiv(
                    snapshots[1].total_ETH,
                    1 ether,
                    snapshots[1].total_stakedStar
                )
                : 1 ether;

            uint256 maxRate = MathUpgradeable.max(newRate, lastRate);
            uint256 minRate = MathUpgradeable.min(newRate, lastRate);

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

        snapshots[0] = snapshots[1];
        snapshots[1] = Snapshot(uint96(total_ETH), uint96(total_stakedStar), uint64(timestamp));

        rateCorrectionFactor = 1 ether;

        if (address(withdrawalAddress).balance > 0) withdrawalAddress.pull();

        emit CommitSnapshot(total_ETH, total_stakedStar, timestamp, newRate);
        emit RateDiff(newRate, currentRate);
    }

    function validatorCreationAvailability() public view returns (bool) {
        return
            address(this).balance >=
            (uint256(32 ether) + pendingWithdrawalSum + localPoolSize);
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
            pendingWithdrawalSum >=
            validatorWithdrawalThreshold +
                freeETH +
                exitedETH +
                fees +
                exitingETH;
    }

    function validatorToDestroy() public view returns (bytes memory) {
        require(validatorDestructionAvailability(), "destroy not available");

        return
            stakeStarRegistry.getValidatorPublicKeys(
                StakeStarRegistry.ValidatorStatus.ACTIVE
            )[0];
    }

    function rate(uint256 timestamp) public view returns (uint256 _rate) {
        require(timestamp >= snapshots[1].timestamp, "timestamp from the past");

        if (snapshots[0].timestamp == 0 && snapshots[1].timestamp == 0) {
            return 1 ether;
        }

        uint256 rate1 = MathUpgradeable.mulDiv(
            snapshots[1].total_ETH,
            1 ether,
            snapshots[1].total_stakedStar
        );

        if (snapshots[0].timestamp == 0) {
            _rate = rate1;
        } else {
            uint256 rate0 = MathUpgradeable.mulDiv(
                snapshots[0].total_ETH,
                1 ether,
                snapshots[0].total_stakedStar
            );

            // distance & snapshot distance
            uint256 d = timestamp - snapshots[1].timestamp;
            uint256 sd = snapshots[1].timestamp - snapshots[0].timestamp;

            _rate = rate1 > rate0
                ? rate1 + MathUpgradeable.mulDiv(rate1 - rate0, d, sd)
                : rate1 - MathUpgradeable.mulDiv(rate0 - rate1, d, sd);
        }

        _rate = MathUpgradeable.mulDiv(_rate, rateCorrectionFactor, 1 ether);
    }

    function rate() public view returns (uint256) {
        return rate(block.timestamp);
    }

    function stakedStarToETH(uint256 ssETH) public view returns (uint256) {
        return MathUpgradeable.mulDiv(ssETH, rate(), 1 ether);
    }

    function ETHToStakedStar(uint256 eth) public view returns (uint256) {
        return MathUpgradeable.mulDiv(eth, 1 ether, rate());
    }
}
