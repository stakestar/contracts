import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture";

describe("ChainlinkProvider", function () {
  describe("Deployment", function () {
    it("Should set the right stakingBalanceFeed", async function () {
      const { chainlinkProvider, addresses } = await loadFixture(
        deployStakeStarFixture
      );

      expect(await chainlinkProvider.stakingBalanceFeed()).to.equal(
        addresses.chainlinkStakingBalanceFeed
      );
    });
  });

  describe("latestStakingBalance", function () {
    it("Should return stakingBalance and timestamp", async function () {
      const { chainlinkProvider } = await loadFixture(deployStakeStarFixture);

      const latestStakingBalance =
        await chainlinkProvider.latestStakingBalance();

      expect(latestStakingBalance.stakingBalance).to.be.gt(0);
      expect(latestStakingBalance.timestamp).to.be.gt(0);
    });
  });
});
