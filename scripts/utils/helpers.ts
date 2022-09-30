import "dotenv/config";
import { AbiCoder } from "@ethersproject/abi";
import { StakeStar } from "../../typechain-types";
import { Environment } from "./types";

export function currentEnvironment() {
  switch (process.env.ENVIRONMENT) {
    case "testnet":
      return Environment.TESTNET;
    case "tenderly":
      return Environment.TENDERLY;
    case "localnet":
      return Environment.LOCALNET;
    default:
      return Environment.LOCALNET;
  }
}

export async function generateValidatorParams(
  privateKey: string,
  operatorPublicKeys: string[],
  operatorIds: number[],
  withdrawalAddress: string
): Promise<StakeStar.ValidatorParamsStruct> {
  const {
    DEFAULT_GENESIS_FORK_VERSION,
    generateDepositData,
    split,
    hexToBytes,
  } = await import("@stakestar/lib");

  const shares = await split(hexToBytes(privateKey), operatorPublicKeys);
  const data = generateDepositData(
    hexToBytes(privateKey),
    withdrawalAddress,
    DEFAULT_GENESIS_FORK_VERSION
  );
  const coder = new AbiCoder();

  return {
    publicKey: data.depositData.pubkey,
    withdrawalCredentials: data.depositData.withdrawalCredentials,
    signature: data.depositData.signature,
    depositDataRoot: data.depositDataRoot,
    operatorIds: operatorIds,
    sharesPublicKeys: shares.map((share: any) =>
      coder.encode(
        ["string"],
        [Buffer.from(share.publicKey).toString("base64")]
      )
    ),
    sharesEncrypted: shares.map((share: any) =>
      coder.encode(["string"], [share.privateKey])
    ),
  };
}
