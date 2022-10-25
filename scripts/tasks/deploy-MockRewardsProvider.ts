import { task } from "hardhat/config";
import { currentNetwork } from "../helpers";

task("deploy-MockRewardsProvider", "Deploy MockRewardsProvider contract").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    console.log(`Network: ${network}`);

    const mockRewardsProviderFactory = await hre.ethers.getContractFactory(
      "MockRewardsProvider"
    );
    const mockRewardsProvider = await hre.upgrades.deployProxy(
      mockRewardsProviderFactory
    );
    await mockRewardsProvider.deployed();
    console.log(
      `MockRewardsProvider is deployed to ${mockRewardsProvider.address}`
    );
  }
);
