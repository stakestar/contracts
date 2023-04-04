import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StakeStar, StakeStarRegistry } from "../../typechain-types";
import { ADDRESSES } from "../../scripts/constants";
import { BigNumber } from "ethers";
import { currentNetwork, retrieveCluster } from "../../scripts/helpers";
import { AbiCoder } from "@ethersproject/abi";

export async function createValidator(
  hre: HardhatRuntimeEnvironment,
  stakeStar: StakeStar,
  stakeStarRegistry: StakeStarRegistry,
  validatorParams: StakeStar.ValidatorParamsStruct
) {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const ssvToken = await ERC20.attach(addresses.ssvToken);

  const [owner, manager] = await hre.ethers.getSigners();

  const operatorIds: BigNumber[] = [];
  for (const operatorId of validatorParams.operatorIds) {
    if (!(await stakeStarRegistry.allowListOfOperators(operatorId))) {
      await stakeStarRegistry.connect(owner).addOperatorToAllowList(operatorId);
    }
    operatorIds.push(BigNumber.from(await operatorId));
  }

  const amount = await ssvToken.balanceOf(owner.address);
  await ssvToken.transfer(stakeStar.address, amount);

  const cluster = await retrieveCluster(
    hre,
    addresses.ssvNetwork,
    stakeStar.address,
    operatorIds
  );

  await stakeStar
    .connect(manager)
    .createValidator(validatorParams, amount, cluster);
}

export async function generateValidatorParams(
  privateKey: string,
  operatorPublicKeys: string[],
  operatorIds: BigNumber[],
  withdrawalAddress: string,
  genesisForkVersion: string
) {
  const { generateDepositData, splitPrivateKey, hexToBytes } = await import(
    "@stakestar/lib"
  );

  const shares = await splitPrivateKey(
    hexToBytes(privateKey),
    operatorIds.map((value) => value.toNumber()),
    operatorPublicKeys
  );
  const data = generateDepositData(
    hexToBytes(privateKey),
    withdrawalAddress,
    genesisForkVersion
  );

  return {
    publicKey: data.depositData.pubkey,
    withdrawalCredentials: data.depositData.withdrawalCredentials,
    signature: data.depositData.signature,
    depositDataRoot: data.depositDataRoot,
    operatorIds: operatorIds,
    sharesEncrypted: new AbiCoder().encode(
      ["string[]"],
      [shares.map((share) => share.privateKey)]
    ),
  } as StakeStar.ValidatorParamsStruct;
}
