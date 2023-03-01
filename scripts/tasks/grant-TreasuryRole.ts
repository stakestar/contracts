import { task } from "hardhat/config";
import { ADDRESSES, ConstantsLib } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function grantAllTreasuryRoles(
  hre: HardhatRuntimeEnvironment,
  uniswapV3ProviderAddress: string,
  stakeStarTreasuryAddress: string
) {
  const UniswapV3Provider = await hre.ethers.getContractFactory(
    "UniswapV3Provider"
  );
  const uniswapV3Provider = await UniswapV3Provider.attach(
    uniswapV3ProviderAddress
  );

  await uniswapV3Provider.grantRole(
    ConstantsLib.TREASURY_ROLE,
    stakeStarTreasuryAddress
  );
  console.log(
    `StakeStarTreasury.TREASURY_ROLE is granted to UniswapV3Provider contract`
  );
}

task(
  "grant-TreasuryRole",
  "Grants a TREASURY_ROLE to StakeStarTreasury contract"
).setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  await grantAllTreasuryRoles(
    hre,
    addresses.uniswapV3Provider,
    addresses.stakeStarTreasury
  );
});
