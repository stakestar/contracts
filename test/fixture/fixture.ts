import {
  ADDRESSES,
  GENESIS_FORK_VERSIONS,
  OPERATOR_IDS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY_1,
  RANDOM_PRIVATE_KEY_2,
} from "../../scripts/constants";
import hre from "hardhat";
import { currentNetwork, generateValidatorParams } from "../../scripts/helpers";
import { deployAll } from "../../scripts/tasks/deployAll";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";
import { grantAllManagerRoles } from "../../scripts/tasks/grant-ManagerRole";
import { grantOraclesRoles } from "../../scripts/tasks/grant-OraclesRole";

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
export async function deployStakeStarFixture() {
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
  // Contracts are deployed using the first signer/account by default
  const [owner, manager, otherAccount, oracle1, oracle2, oracle3] = await hre.ethers.getSigners();

  const stakeStarOwner = stakeStar.connect(owner);
  const stakeStarManager = stakeStarOwner.connect(manager);
  const stakeStarPublic = stakeStarOwner.connect(otherAccount);
  const stakeStarRegistryManager = stakeStarRegistry.connect(manager);

  const stakeStarOracleAdmin = stakeStarOracle.connect(owner);
  const stakeStarOracle1 = stakeStarOracle.connect(oracle1);
  const stakeStarOracle2 = stakeStarOracle.connect(oracle2);
  const stakeStarOracle3 = stakeStarOracle.connect(oracle3);

  const stakeStarOracleStrictAdmin = stakeStarOracleStrict.connect(owner);
  const stakeStarOracleStrict1 = stakeStarOracleStrict.connect(oracle1);
  const stakeStarOracleStrict2 = stakeStarOracleStrict.connect(oracle2);
  const stakeStarOracleStrict3 = stakeStarOracleStrict.connect(oracle3);

  await grantAllManagerRoles(
    hre,
    stakeStar.address,
    stakeStarRegistry.address,
    manager.address
  );

  await grantOraclesRoles(
    hre,
    stakeStarOracleAdmin,
    oracle1.address,
    oracle2.address,
    oracle3.address,
  );

  await grantOraclesRoles(
    hre,
    stakeStarOracleStrictAdmin,
    oracle1.address,
    oracle2.address,
    oracle3.address,
  );

  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const ssvToken = await ERC20.attach(addresses.ssvToken);
  const ssvNetwork = new Contract(
    addresses.ssvNetwork,
    [
      "function getAddressBalance(address ownerAddress) external view returns (uint256)",
      "function getAddressBurnRate(address ownerAddress) external view returns (uint256)",
      "function getValidatorsByOwnerAddress(address ownerAddress) external view returns (bytes[] memory)",
    ],
    otherAccount
  );

  const validatorParams1 = await generateValidatorParams(
    RANDOM_PRIVATE_KEY_1,
    OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
    OPERATOR_IDS[currentNetwork(hre)],
    withdrawalAddress.address,
    GENESIS_FORK_VERSIONS[currentNetwork(hre)]
  );

  const validatorParams2 = await generateValidatorParams(
    RANDOM_PRIVATE_KEY_2,
    OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
    OPERATOR_IDS[currentNetwork(hre)],
    withdrawalAddress.address,
    GENESIS_FORK_VERSIONS[currentNetwork(hre)]
  );

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
    stakeStarOracleAdmin,
    stakeStarOracle1,
    stakeStarOracle2,
    stakeStarOracle3,

    stakeStarOracleStrict,
    stakeStarOracleStrictAdmin,
    stakeStarOracleStrict1,
    stakeStarOracleStrict2,
    stakeStarOracleStrict3,

    uniswapV3Provider,
    ssvToken,
    ssvNetwork,
    uniswapHelper,
    validatorParams1,
    validatorParams2,
    owner,
    manager,
    otherAccount,
    withdrawalAddress,
    feeRecipient,
    mevRecipient,
  };
}

describe("Deploy", function () {
  it("Should deploy all StakeStar contracts", async function () {
    await loadFixture(deployStakeStarFixture);
  });
});
