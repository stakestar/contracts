import { task } from "hardhat/config";
import { ADDRESSES, OPERATOR_IDS } from "../constants";
import { currentNetwork, retrieveCluster } from "../helpers";

task("reactivate", "Reactivates cluster in SSV network").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const cluster = await retrieveCluster(
      hre,
      addresses.ssvNetwork,
      stakeStar.address,
      OPERATOR_IDS[network]
    );

    const tx = await stakeStar.reactivate(OPERATOR_IDS[network], 0, cluster);
    await tx.wait(3);
    console.log(tx.hash);
    console.log("Cluster has been reactivated");
  }
);
