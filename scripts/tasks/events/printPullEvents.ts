import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork } from "../../helpers";

task("printPullEvents", "Prints Pull events").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const ETHReceiver = await hre.ethers.getContractFactory("ETHReceiver");
  const withdrawalAddress = await ETHReceiver.attach(
    addresses.withdrawalAddress
  );

  const events = await withdrawalAddress.queryFilter(
    withdrawalAddress.filters.Pull()
  );

  for (const event of events) {
    const timestamp = (await event.getBlock()).timestamp;
    console.log(
      timestamp,
      new Date(timestamp * 1000).toISOString(),
      event.args.value.toString()
    );
  }
});
