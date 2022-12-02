import {
  ADDRESSES,
  GENESIS_FORK_VERSIONS,
  OPERATOR_IDS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY,
} from "../scripts/constants";
import hre from "hardhat";
import { currentNetwork, generateValidatorParams } from "../scripts/helpers";
import { deployAll } from "../scripts/tasks/deployAll";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
export async function deployStakeStarFixture() {
  const addresses = ADDRESSES[currentNetwork(hre)];

  const {
    stakeStar,
    stakeStarRegistry,
    stakeStarTreasury,
    stakeStarETH,
    stakeStarRewards,
    chainlinkProvider,
  } = await deployAll(hre);
  // Contracts are deployed using the first signer/account by default
  const [owner, manager, otherAccount] = await hre.ethers.getSigners();

  const stakeStarOwner = stakeStar.connect(owner);
  const stakeStarManager = stakeStarOwner.connect(manager);
  const stakeStarPublic = stakeStarOwner.connect(otherAccount);

  await stakeStarOwner.grantRole(
    await stakeStarOwner.MANAGER_ROLE(),
    manager.address
  );

  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const ssvToken = await ERC20.attach(addresses.ssvToken);
  const ssvNetwork = new Contract(
    addresses.ssvNetwork,
    [
      "function getAddressBalance(address ownerAddress) external view returns (uint256)",
    ],
    otherAccount
  );

  const validatorParams = await generateValidatorParams(
    RANDOM_PRIVATE_KEY,
    OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
    OPERATOR_IDS[currentNetwork(hre)],
    stakeStarRewards.address,
    GENESIS_FORK_VERSIONS[currentNetwork(hre)]
  );

  return {
    hre,
    addresses,
    stakeStarOwner,
    stakeStarManager,
    stakeStarPublic,
    stakeStarRegistry,
    stakeStarTreasury,
    stakeStarETH,
    stakeStarRewards,
    chainlinkProvider,
    ssvToken,
    ssvNetwork,
    validatorParams,
    owner,
    manager,
    otherAccount,
  };
}

describe("Deploy", function () {
  it("Should deploy all StakeStar contracts", async function () {
    await loadFixture(deployStakeStarFixture);
  });
});
