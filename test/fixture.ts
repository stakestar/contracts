import {
  ADDRESSES,
  GENESIS_FORK_VERSIONS,
  OPERATOR_IDS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY,
} from "../scripts/constants";
import hre, { ethers, upgrades } from "hardhat";
import { currentNetwork, generateValidatorParams } from "../scripts/helpers";

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
export async function deployStakeStarFixture() {
  const addresses = ADDRESSES[currentNetwork(hre)];

  // Contracts are deployed using the first signer/account by default
  const [owner, manager, otherAccount] = await ethers.getSigners();

  const StakeStarRegistry = await ethers.getContractFactory(
    "StakeStarRegistry"
  );
  const stakeStarRegistry = await upgrades.deployProxy(StakeStarRegistry);
  await stakeStarRegistry.deployed();

  const StakeStarTreasury = await ethers.getContractFactory(
    "StakeStarTreasury"
  );
  const stakeStarTreasury = await upgrades.deployProxy(StakeStarTreasury);
  await stakeStarTreasury.deployed();

  const MockRewardsProvider = await ethers.getContractFactory(
    "MockRewardsProvider"
  );
  const mockRewardsProvider = await MockRewardsProvider.deploy();
  await mockRewardsProvider.deployed();

  const StakeStar = await ethers.getContractFactory("StakeStar");
  const stakeStarOwner = await upgrades.deployProxy(StakeStar, [
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken,
    stakeStarRegistry.address,
    stakeStarTreasury.address,
  ]);
  await stakeStarOwner.deployed();
  const stakeStarManager = stakeStarOwner.connect(manager);
  const stakeStarPublic = stakeStarOwner.connect(otherAccount);

  await stakeStarOwner.grantRole(
    await stakeStarOwner.MANAGER_ROLE(),
    manager.address
  );
  await stakeStarRegistry.grantRole(
    await stakeStarRegistry.STAKE_STAR_ROLE(),
    stakeStarOwner.address
  );

  const StakeStarETH = await ethers.getContractFactory("StakeStarETH");
  const stakeStarETH = await StakeStarETH.attach(
    await stakeStarOwner.stakeStarETH()
  );

  const StakeStarRewards = await ethers.getContractFactory("StakeStarRewards");
  const stakeStarRewards = await StakeStarRewards.attach(
    await stakeStarOwner.stakeStarRewards()
  );

  const ERC20 = await ethers.getContractFactory("ERC20");
  const ssvToken = await ERC20.attach(addresses.ssvToken);

  const validatorParams = await generateValidatorParams(
    RANDOM_PRIVATE_KEY,
    OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
    OPERATOR_IDS[currentNetwork(hre)],
    stakeStarRewards.address,
    GENESIS_FORK_VERSIONS[currentNetwork(hre)]
  );

  return {
    hre,
    stakeStarOwner,
    stakeStarManager,
    stakeStarPublic,
    stakeStarRegistry,
    stakeStarTreasury,
    stakeStarETH,
    stakeStarRewards,
    mockRewardsProvider,
    ssvToken,
    validatorParams,
    owner,
    manager,
    otherAccount,
  };
}
