import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture";

describe("ChainlinkProvider", function () {
  describe("Deployment", function () {
    it("Should set the right stakingBalanceFeed", async function () {
      const { chainlinkProvider, aggregatorV3Mock } = await loadFixture(
        deployStakeStarFixture
      );

      expect(await chainlinkProvider.stakingBalanceFeed()).to.equal(
        aggregatorV3Mock.address
      );
    });
  });

  describe("latestStakingBalance", function () {
    it("Should return stakingBalance and timestamp", async function () {
      const { chainlinkProvider, aggregatorV3Mock } = await loadFixture(
        deployStakeStarFixture
      );

      await aggregatorV3Mock.setMockValues(7, 7);

      const latestStakingBalance =
        await chainlinkProvider.latestStakingBalance();

      expect(latestStakingBalance.stakingBalance).to.eq(7);
      expect(latestStakingBalance.timestamp).to.be.eq(7);
    });
  });
});
