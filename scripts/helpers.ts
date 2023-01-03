import { AbiCoder } from "@ethersproject/abi";
import { StakeStar } from "../typechain-types";
import { Network } from "./types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BigNumber } from "ethers";

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

export function humanify(
  n: BigNumber,
  decimals: number = 18,
  digits: number = 5
) {
  return (
    n.div(BigNumber.from(10 ** (decimals - digits))).toNumber() / 10 ** digits
  );
}
