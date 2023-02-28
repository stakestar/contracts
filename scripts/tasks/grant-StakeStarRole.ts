import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function grantAllStakeStarRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarAddress: string,
  stakeStarETHAddress: string,
  stakeStarRegistryAddress: string,
  feeRecipientAddress: string,
  withdrawalAddressAddress: string
) {
  const StakeStarRegistry = await hre.ethers.getContractFactory(
    "StakeStarRegistry"
  );
  const stakeStarRegistry = await StakeStarRegistry.attach(
    stakeStarRegistryAddress
  );

  const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
  const stakeStarETH = await StakeStarETH.attach(stakeStarETHAddress);

  const FeeRecipient = await hre.ethers.getContractFactory("FeeRecipient");
  const WithdrawalAddress = await hre.ethers.getContractFactory(
    "WithdrawalAddress"
  );
  const feeRecipient = await FeeRecipient.attach(feeRecipientAddress);
  const withdrawalAddress = await WithdrawalAddress.attach(
    withdrawalAddressAddress
  );

  await stakeStarRegistry.grantRole(
    await stakeStarRegistry.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(
    `StakeStarRegistry.STAKE_STAR_ROLE is granted to StakeStar contract`
  );
  await stakeStarETH.grantRole(
    await stakeStarETH.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(`StakeStarETH.STAKE_STAR_ROLE is granted to StakeStar contract`);
  await feeRecipient.grantRole(
    await feeRecipient.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(`FeeRecipient.STAKE_STAR_ROLE is granted to StakeStar contract`);
  await withdrawalAddress.grantRole(
    await withdrawalAddress.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(
    `WithdrawalAddress.STAKE_STAR_ROLE is granted to StakeStar contract`
  );
}

task(
  "grant-StakeStarRole",
  "Grants a STAKE_STAR_ROLE to StakeStar contract"
).setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  await grantAllStakeStarRoles(
    hre,
    addresses.stakeStar,
    addresses.stakeStarETH,
    addresses.stakeStarRegistry,
    addresses.feeRecipient,
    addresses.withdrawalAddress
  );
});
