import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture";

describe("ChainlinkProvider", function () {
  describe("Deployment", function () {
    it("Should set the right stakingSurplusFeed", async function () {
      const { chainlinkProvider, aggregatorV3Mock } = await loadFixture(
        deployStakeStarFixture
      );

      expect(await chainlinkProvider.stakingSurplusFeed()).to.equal(
        aggregatorV3Mock.address
      );
    });
  });

  describe("latestStakingSurplus", function () {
    it("Should return stakingSurplus and timestamp", async function () {
      const { chainlinkProvider, aggregatorV3Mock } = await loadFixture(
        deployStakeStarFixture
      );

      await aggregatorV3Mock.setMockValues(7, 7);

      const latestStakingSurplus =
        await chainlinkProvider.latestStakingSurplus();

      expect(latestStakingSurplus.stakingSurplus).to.eq(7);
      expect(latestStakingSurplus.timestamp).to.be.eq(7);
    });
  });
});
