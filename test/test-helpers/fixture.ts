import {
  ADDRESSES,
  GENESIS_FORK_VERSIONS,
  OPERATOR_IDS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY_1,
  RANDOM_PRIVATE_KEY_2,
} from "../../scripts/constants";
import hre from "hardhat";
import { currentNetwork } from "../../scripts/helpers";
import { deployAll } from "../../scripts/tasks/deployAll";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { grantAllManagerRoles } from "../../scripts/tasks/grant-ManagerRole";
import { grantOracleRoles } from "../../scripts/tasks/grant-OracleRole";
import { generateValidatorParams } from "./wrappers";

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
export async function deployStakeStarFixture() {
  if (process.env.STORAGE_LAYOUT === "true") {
    await hre.storageLayout.export();
  }
  const addresses = ADDRESSES[currentNetwork(hre)];

  const {
    stakeStar,
    stakeStarRegistry,
    stakeStarTreasury,
    sstarETH,
    starETH,
    uniswapV3Provider,
    withdrawalAddress,
    feeRecipient,
    mevRecipient,
    stakeStarOracle,
    stakeStarOracleStrict,
    uniswapHelper,
  } = await deployAll(hre);

  const UtilsMock = await hre.ethers.getContractFactory("UtilsMock");
  const utilsMock = await UtilsMock.deploy();
  await utilsMock.deployed();
  console.log(`UtilsMock is deployed to ${utilsMock.address}`);

  // Contracts are deployed using the first signer/account by default
  const [owner, manager, otherAccount, oracle1, oracle2, oracle3] =
    await hre.ethers.getSigners();

  const stakeStarOwner = stakeStar.connect(owner);
  const stakeStarManager = stakeStarOwner.connect(manager);
  const stakeStarPublic = stakeStarOwner.connect(otherAccount);
  const stakeStarRegistryManager = stakeStarRegistry.connect(manager);

  const stakeStarOracle1 = stakeStarOracle.connect(oracle1);
  const stakeStarOracle2 = stakeStarOracle.connect(oracle2);
  const stakeStarOracle3 = stakeStarOracle.connect(oracle3);

  const stakeStarOracleStrict1 = stakeStarOracleStrict.connect(oracle1);
  const stakeStarOracleStrict2 = stakeStarOracleStrict.connect(oracle2);
  const stakeStarOracleStrict3 = stakeStarOracleStrict.connect(oracle3);

  await grantAllManagerRoles(
    hre,
    stakeStar.address,
    stakeStarRegistry.address,
    stakeStarTreasury.address,
    manager.address
  );

  await grantOracleRoles(
    hre,
    stakeStarOracle.address,
    stakeStarOracleStrict.address,
    oracle1.address,
    oracle2.address,
    oracle3.address
  );

  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const ssvToken = await ERC20.attach(addresses.ssvToken);
  const SSVNetwork = await hre.ethers.getContractFactory("SSVNetwork");
  const SSVNetworkViews = await hre.ethers.getContractFactory(
    "SSVNetworkViews"
  );
  const ssvNetwork = await SSVNetwork.attach(addresses.ssvNetwork);
  const ssvNetworkViews = await SSVNetworkViews.attach(
    addresses.ssvNetworkViews
  );

  const operatorIDs = OPERATOR_IDS[currentNetwork(hre)];

  const validatorParams1 = await generateValidatorParams(
    RANDOM_PRIVATE_KEY_1,
    OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
    operatorIDs,
    withdrawalAddress.address,
    GENESIS_FORK_VERSIONS[currentNetwork(hre)]
  );

  const validatorParams2 = await generateValidatorParams(
    RANDOM_PRIVATE_KEY_2,
    OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
    operatorIDs,
    withdrawalAddress.address,
    GENESIS_FORK_VERSIONS[currentNetwork(hre)]
  );

  addresses.stakeStarOracle = stakeStarOracle.address;
  addresses.stakeStarOracleStrict = stakeStarOracleStrict.address;
  addresses.stakeStarTreasury = stakeStarTreasury.address;
  addresses.stakeStarRegistry = stakeStarRegistry.address;
  addresses.withdrawalAddress = withdrawalAddress.address;
  addresses.feeRecipient = feeRecipient.address;
  addresses.mevRecipient = mevRecipient.address;
  addresses.sstarETH = sstarETH.address;
  addresses.starETH = starETH.address;
  addresses.stakeStar = stakeStar.address;
  addresses.uniswapV3Provider = uniswapV3Provider.address;
  addresses.uniswapHelper = uniswapHelper.address;
  addresses.oracle1 = oracle1.address;
  addresses.oracle2 = oracle2.address;
  addresses.oracle3 = oracle3.address;

  return {
    hre,
    addresses,

    stakeStarOwner,
    stakeStarManager,
    stakeStarPublic,
    stakeStarRegistry,
    stakeStarRegistryManager,
    stakeStarTreasury,
    sstarETH,
    starETH,

    stakeStarOracle,
    stakeStarOracle1,
    stakeStarOracle2,
    stakeStarOracle3,

    stakeStarOracleStrict,
    stakeStarOracleStrict1,
    stakeStarOracleStrict2,
    stakeStarOracleStrict3,

    uniswapV3Provider,
    ssvToken,
    ssvNetwork,
    ssvNetworkViews,
    uniswapHelper,
    validatorParams1,
    validatorParams2,
    operatorIDs,
    owner,
    manager,
    otherAccount,
    withdrawalAddress,
    feeRecipient,
    mevRecipient,

    utilsMock,
  };
}

describe("Deploy", function () {
  it("Should deploy all StakeStar contracts", async function () {
    await loadFixture(deployStakeStarFixture);
  });
});
