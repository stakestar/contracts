import { task } from "hardhat/config";
import { ADDRESSES, OPERATOR_IDS } from "../constants";
import { currentNetwork } from "../helpers";

task("allowListOperators", "AllowLists operators in Registry").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarRegistry = await hre.ethers.getContractFactory(
      "StakeStarRegistry"
    );
    const stakeStarRegistry = await StakeStarRegistry.attach(
      addresses.stakeStarRegistry
    );

    const operators = OPERATOR_IDS[network];

    for (const operator of operators) {
      const tx = await stakeStarRegistry.addOperatorToAllowList(operator);
      await tx.wait(3);

      console.log(`Operator ${operator} is allowListed`);
    }
  }
);
