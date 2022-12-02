// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/IStakingPool.sol";
import "./interfaces/IConsensusDataProvider.sol";
import "./StakeStarRegistry.sol";
import "./StakeStarETH.sol";
import "./StakeStarRewards.sol";
import "./StakeStarTreasury.sol";

import "./interfaces/IDepositContract.sol";
import "./interfaces/ISSVNetwork.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

// TODO Manage SSV position
// TODO Validator Destruction: prevent double validator destroy, local pool
// TODO Add corresponding events
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
    event SetLocalPoolSize(uint256 size);
    event CreateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event UpdateValidator(ValidatorParams params, uint256 ssvDepositAmount);
    event DestroyValidator(bytes publicKey);
    event Stake(address indexed who, uint256 amount);
    event Unstake(address indexed who, uint256 amount);
    event Claim(address indexed who, uint256 amount);
    event Harvest(uint256 amount);

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
    uint256 public pendingUnstakeSum;

    uint256 public localPoolSize;

    int256 public stakingSurplusA;
    uint256 public timestampA;
    int256 public stakingSurplusB;
    uint256 public timestampB;
    uint256 constant minimumTimestampDistance = 180;

    uint256 public reservedTreasuryCommission;

    receive() external payable {}

    function initialize() public initializer {
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

        consensusDataProvider = IConsensusDataProvider(consensusDataProviderAddress);

        stakeStarRegistry = StakeStarRegistry(stakeStarRegistryAddress);
        stakeStarETH = StakeStarETH(stakeStarETHAddress);
        stakeStarRewards = StakeStarRewards(payable(stakeStarRewardsAddress));
        stakeStarTreasury = StakeStarTreasury(payable(stakeStarTreasuryAddress));

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

    function setLocalPoolSize(uint256 size) public onlyRole(DEFAULT_ADMIN_ROLE) {
        localPoolSize = size;

        emit SetLocalPoolSize(size);
    }

    function stake() public payable {
        require(msg.value > 0, "no eth transferred");

        uint256 ssETH = ETH_to_ssETH_approximate(msg.value);
        stakeStarETH.mint(msg.sender, ssETH);

        emit Stake(msg.sender, msg.value);
    }

    function unstake(uint256 ssETH) public returns (uint256 eth) {
        stakeStarETH.burn(msg.sender, ssETH);

        eth = ssETH_to_ETH_approximate(ssETH);
        pendingUnstake[msg.sender] += eth;
        pendingUnstakeSum += eth;

        emit Unstake(msg.sender, eth);
    }

    function claim() public {
        require(pendingUnstake[msg.sender] > 0, "no pending unstake");

        uint256 eth = pendingUnstake[msg.sender];
        delete pendingUnstake[msg.sender];
        pendingUnstakeSum -= eth;

        (bool status,) = msg.sender.call{value : eth}("");
        require(status, "failed to send Ether");

        emit Claim(msg.sender, eth);
    }

    function unstakeAndClaim(uint256 ssETH) public {
        unstake(ssETH);
        claim();
    }

    function createValidator(ValidatorParams calldata validatorParams, uint256 ssvDepositAmount) public onlyRole(MANAGER_ROLE) {
        require(validatorCreationAvailability(), "cannot create validator");
        require(stakeStarRegistry.verifyOperators(validatorParams.operatorIds), "some operators not allowListed");

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
        require(stakeStarRegistry.verifyOperators(validatorParams.operatorIds), "some operators not allowListed");

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

    function destroyValidator(bytes memory publicKey) public onlyRole(MANAGER_ROLE) {
        revert("not implemented");
    }

    function harvest() public {
        uint256 amount = address(stakeStarRewards).balance;
        require(amount > 0, "no rewards available");
        stakeStarRewards.pull();

        uint256 treasuryCommission = stakeStarTreasury.commission(int256(amount));
        (bool status,) = payable(stakeStarTreasury).call{value : treasuryCommission}("");
        require(status, "failed to send Ether");

        uint256 rewards = amount - treasuryCommission;
        stakeStarETH.updateRate(int256(rewards));

        emit Harvest(rewards);
    }

    function commitStakingSurplus() public {
        (uint256 latestStakingBalance, uint256 timestamp) = consensusDataProvider.latestStakingBalance();

        require(timestamp >= timestampB + minimumTimestampDistance, "timestamp distance too short");

        uint256 activeValidators = stakeStarRegistry.countValidatorPublicKeys(StakeStarRegistry.ValidatorStatus.CREATED);
        int256 latestStakingSurplus = int256(latestStakingBalance) - int256(activeValidators * 32 ether);

        stakingSurplusA = stakingSurplusB;
        timestampA = timestampB;

        reservedTreasuryCommission = stakeStarTreasury.commission(latestStakingSurplus);
        stakingSurplusB = latestStakingSurplus - int256(reservedTreasuryCommission);
        timestampB = timestamp;

        if (approximationDataInitialized()) {
            int256 ethChange = stakingSurplusB - stakingSurplusA;
            stakeStarETH.updateRate(ethChange);
        } else {
            stakeStarETH.updateRate(stakingSurplusB);
        }
    }

    function manageSSV(address WETH, uint24 fee, uint256 amountIn, uint256 amountOutMinimum) public onlyRole(DEFAULT_ADMIN_ROLE) {
        ISwapRouter swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

        ISwapRouter.ExactInputSingleParams memory params =
        ISwapRouter.ExactInputSingleParams({
        tokenIn : WETH,
        tokenOut : address(ssvToken),
        fee : fee,
        recipient : address(this),
        deadline : block.timestamp,
        amountIn : amountIn,
        amountOutMinimum : amountOutMinimum,
        sqrtPriceLimitX96 : 0
        });

        uint256 amountOut = swapRouter.exactInputSingle{value : amountIn}(params);
        uint256 depositAmount = ssvToken.balanceOf(address(this)) / 1e7 * 1e7;
        ssvToken.approve(address(ssvNetwork), depositAmount);
        ssvNetwork.deposit(address(this), depositAmount);
    }

    function validatorCreationAvailability() public view returns (bool) {
        return address(this).balance >= (uint256(32 ether) + localPoolSize + pendingUnstakeSum);
    }

    function validatorDestructionAvailability() public view returns (bool) {
        revert("not implemented");
    }

    function approximateStakingSurplus(uint256 timestamp) public view returns (int256) {
        require(timestampA * timestampB > 0, "point A or B not initialized");
        require(timestampA + minimumTimestampDistance <= timestampB, "timestamp distance too short");
        require(timestampB <= timestamp, "timestamp in the past");

        if (timestampB == timestamp) return stakingSurplusB;

        return (stakingSurplusB - stakingSurplusA) * (int256(timestamp) - int256(timestampB)) / (int256(timestampB) - int256(timestampA)) + stakingSurplusB;
    }

    function approximateRate(uint256 timestamp) public view returns (uint256) {
        if (approximationDataInitialized()) {
            int256 approximateStakingSurplus = approximateStakingSurplus(timestamp);
            int256 approximateEthChange = approximateStakingSurplus - stakingSurplusB;
            return stakeStarETH.estimateRate(approximateEthChange);
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

    function ssETH_to_ETH_approximate(uint256 ssETH) public view returns (uint256) {
        return ssETH * currentApproximateRate() / 1 ether;
    }

    function ETH_to_ssETH_approximate(uint256 eth) public view returns (uint256) {
        return eth * 1 ether / currentApproximateRate();
    }
}
