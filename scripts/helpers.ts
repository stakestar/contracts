import { AbiCoder } from "@ethersproject/abi";
import { StakeStar } from "../typechain-types";
import { Network } from "./types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export function currentNetwork(hre: HardhatRuntimeEnvironment) {
  switch (hre.network.name) {
    case "hardhat":
      return Network.HARDHAT;
    case "goerli":
      return Network.GOERLI;

    default:
      throw "Unsupported network";
  }
}

export async function generateValidatorParams(
  privateKey: string,
  operatorPublicKeys: string[],
  operatorIds: number[],
  withdrawalAddress: string,
  genesisForkVersion: string
): Promise<StakeStar.ValidatorParamsStruct> {
  const { generateDepositData, splitPrivateKey, hexToBytes } = await import(
    "@stakestar/lib"
  );

  const shares = await splitPrivateKey(
    hexToBytes(privateKey),
    operatorIds,
    operatorPublicKeys
  );
  const data = generateDepositData(
    hexToBytes(privateKey),
    withdrawalAddress,
    genesisForkVersion
  );
  const coder = new AbiCoder();

  return {
    publicKey: data.depositData.pubkey,
    withdrawalCredentials: data.depositData.withdrawalCredentials,
    signature: data.depositData.signature,
    depositDataRoot: data.depositDataRoot,
    operatorIds: operatorIds,
    sharesPublicKeys: shares.map((share) => share.publicKey),
    sharesEncrypted: shares.map((share) =>
      coder.encode(["string"], [share.privateKey])
    ),
  };
}
