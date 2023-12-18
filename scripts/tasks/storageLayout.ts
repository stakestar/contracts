import { task } from "hardhat/config";

task("storageLayout", "hardhat-storage-layout").setAction(async (args, hre) => {
  await hre.storageLayout.export();
});
