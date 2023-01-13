import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture";

describe("ChainlinkProvider", function () {
  describe("Deployment", function () {
    it("Should set the right DEFAULT_ADMIN", async function () {
      const { chainlinkProvider, owner } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await chainlinkProvider.hasRole(
          await chainlinkProvider.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
    });
  });

  describe("Save", function () {
    it("Should revert", async function () {
      const { chainlinkProvider } = await loadFixture(deployStakeStarFixture);

      await expect(chainlinkProvider.save()).to.be.revertedWith(
        "no implementation from Chainlink yet"
      );
    });
  });
});
