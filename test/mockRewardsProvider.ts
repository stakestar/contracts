import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";

describe("MockRewardsProvider", function () {
  describe("Provide rewards", function () {
    it("Should store updated rewards", async function () {
      const { mockRewardsProvider, owner } = await loadFixture(
        deployStakeStarFixture
      );

      const rewards = 123;

      await expect(mockRewardsProvider.connect(owner).provideRewards(123))
        .to.emit(mockRewardsProvider, "ProvideRewards")
        .withArgs(123);

      expect(await mockRewardsProvider.getRewards()).to.equal(123);
    });
  });
});
