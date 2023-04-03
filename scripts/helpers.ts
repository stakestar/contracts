import { Network } from "./types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BigNumber, BigNumberish } from "ethers";

export function currentNetwork(hre: HardhatRuntimeEnvironment) {
  switch (hre.network.name) {
    case "hardhat":
      return Network.HARDHAT;
    case "goerli":
      return Network.GOERLI;

    default:
      throw new Error("Unsupported network");
  }
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

export async function retrieveCluster(
  hre: HardhatRuntimeEnvironment,
  ssvNetworkAddress: string,
  ownerAddress: string,
  operatorIds: BigNumberish[]
) {
  const SSVNetwork = await hre.ethers.getContractFactory("SSVNetwork");
  const ssvNetwork = await SSVNetwork.attach(ssvNetworkAddress);

  // TODO owner topic
  const filters = [
    ssvNetwork.filters.ClusterDeposited(ownerAddress),
    ssvNetwork.filters.ClusterWithdrawn(ownerAddress),
    ssvNetwork.filters.ValidatorRemoved(ownerAddress),
    ssvNetwork.filters.ValidatorAdded(ownerAddress),
    ssvNetwork.filters.ClusterLiquidated(ownerAddress),
    ssvNetwork.filters.ClusterReactivated(ownerAddress),
  ];

  let latestBlockNumber = 0;
  let cluster = {
    validatorCount: 0,
    networkFeeIndex: BigNumber.from(0),
    index: BigNumber.from(0),
    balance: BigNumber.from(0),
    active: true,
  };

  for (const filter of filters) {
    const events = await ssvNetwork.queryFilter(filter);
    for (const event of events) {
      if (event.blockNumber > latestBlockNumber) {
        // TODO operator ids verification
        latestBlockNumber = event.blockNumber;
        cluster = event.args.cluster;
      }
    }
  }

  return cluster;
}
