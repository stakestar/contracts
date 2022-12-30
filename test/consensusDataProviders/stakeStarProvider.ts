import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture";

describe("StakeStarProvider", function () {
  describe("Deployment", function () {
    it("Should set the right manager", async function () {
      const { stakeStarProvider, manager } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarProvider.hasRole(
          await stakeStarProvider.MANAGER_ROLE(),
          manager.address
        )
      ).to.equal(true);
    });
  });

  describe("stakingSurplus", function () {
    it("Should commit staking surplus", async function () {
      const { stakeStarProvider, stakeStarProviderManager, owner } =
        await loadFixture(deployStakeStarFixture);

      expect(await stakeStarProvider.latestTimestamp()).to.eq(0);

      const latestStakingSurplus =
        await stakeStarProvider.latestStakingSurplus();

      expect(latestStakingSurplus.stakingSurplus).to.eq(0);
      expect(latestStakingSurplus.timestamp).to.be.eq(0);

      await expect(
        stakeStarProvider.commitStakingSurplus(1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarProvider.MANAGER_ROLE()}`
      );

      await expect(stakeStarProviderManager.commitStakingSurplus(2, 3))
        .to.emit(stakeStarProvider, "CommitStakingSurplus")
        .withArgs(2, 3);

      const latestStakingSurplus2 =
        await stakeStarProvider.latestStakingSurplus();

      expect(latestStakingSurplus2.stakingSurplus).to.eq(2);
      expect(latestStakingSurplus2.timestamp).to.be.eq(3);

      await expect(
        stakeStarProviderManager.commitStakingSurplus(1, 1)
      ).to.be.revertedWith("timestamp too old");
      await expect(
        stakeStarProviderManager.commitStakingSurplus(1, 3)
      ).to.be.revertedWith("timestamp too old");
    });
  });
});
