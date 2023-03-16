import { task } from "hardhat/config";
import { ADDRESSES, ConstantsLib } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function grantAllStakeStarRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarAddress: string,
  sstarETHAddress: string,
  starETHAddress: string,
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

  const SStarETH = await hre.ethers.getContractFactory("SStarETH");
  const sstarETH = await SStarETH.attach(sstarETHAddress);
  const StarETH = await hre.ethers.getContractFactory("StarETH");
  const starETH = await StarETH.attach(starETHAddress);

  const ETHReceiver = await hre.ethers.getContractFactory("ETHReceiver");
  const withdrawalAddress = await ETHReceiver.attach(withdrawalAddressAddress);
  const feeRecipient = await ETHReceiver.attach(feeRecipientAddress);
  const mevRecipient = await ETHReceiver.attach(mevRecipientAddress);

  let tx;

  tx = await stakeStarRegistry.grantRole(
    ConstantsLib.STAKE_STAR_ROLE,
    stakeStarAddress
  );
  console.log(tx.hash);
  console.log(
    `StakeStarRegistry.STAKE_STAR_ROLE is granted to StakeStar contract`
  );

  tx = await sstarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, stakeStarAddress);
  console.log(tx.hash);
  console.log(`sstarETH.STAKE_STAR_ROLE is granted to StakeStar contract`);

  tx = await starETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, stakeStarAddress);
  console.log(tx.hash);
  console.log(`starETH.STAKE_STAR_ROLE is granted to StakeStar contract`);

  tx = await withdrawalAddress.grantRole(
    ConstantsLib.STAKE_STAR_ROLE,
    stakeStarAddress
  );
  console.log(tx.hash);
  console.log(
    `WithdrawalAddress.STAKE_STAR_ROLE is granted to StakeStar contract`
  );

  tx = await feeRecipient.grantRole(
    ConstantsLib.STAKE_STAR_ROLE,
    stakeStarAddress
  );
  console.log(tx.hash);
  console.log(`FeeRecipient.STAKE_STAR_ROLE is granted to StakeStar contract`);

  tx = await mevRecipient.grantRole(
    ConstantsLib.STAKE_STAR_ROLE,
    stakeStarAddress
  );
  console.log(tx.hash);
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
    addresses.sstarETH,
    addresses.starETH,
    addresses.stakeStarRegistry,
    addresses.withdrawalAddress,
    addresses.feeRecipient,
    addresses.mevRecipient
  );
});
