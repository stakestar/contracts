import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function grantAllStakeStarRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarAddress: string,
  stakeStarETHAddress: string,
  stakeStarRegistryAddress: string,
  withdrawalAddressAddress: string,
  feeRecipientAddress: string,
  mevRecipientAddress: string
) {
  const StakeStarRegistry = await hre.ethers.getContractFactory(
    "StakeStarRegistry"
  );
  const stakeStarRegistry = await StakeStarRegistry.attach(
    stakeStarRegistryAddress
  );

  const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
  const stakeStarETH = await StakeStarETH.attach(stakeStarETHAddress);

  const ETHReceiver = await hre.ethers.getContractFactory("ETHReceiver");
  const withdrawalAddress = await ETHReceiver.attach(withdrawalAddressAddress);
  const feeRecipient = await ETHReceiver.attach(feeRecipientAddress);
  const mevRecipient = await ETHReceiver.attach(mevRecipientAddress);

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

  await withdrawalAddress.grantRole(
    await withdrawalAddress.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(
    `WithdrawalAddress.STAKE_STAR_ROLE is granted to StakeStar contract`
  );
  await feeRecipient.grantRole(
    await feeRecipient.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(`FeeRecipient.STAKE_STAR_ROLE is granted to StakeStar contract`);
  await mevRecipient.grantRole(
    await mevRecipient.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(`MevRecipient.STAKE_STAR_ROLE is granted to StakeStar contract`);
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
    addresses.withdrawalAddress,
    addresses.feeRecipient,
    addresses.mevRecipient
  );
});
