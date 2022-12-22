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

  describe("stakingBalance", function () {
    it("Should commit staking balance", async function () {
      const { stakeStarProvider, owner, manager } = await loadFixture(
        deployStakeStarFixture
      );

      expect(await stakeStarProvider.latestTimestamp()).to.eq(0);

      const latestStakingBalance =
        await stakeStarProvider.latestStakingBalance();

      expect(latestStakingBalance.stakingBalance).to.eq(0);
      expect(latestStakingBalance.timestamp).to.be.eq(0);

      await expect(
        stakeStarProvider.commitStakingBalance(1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarProvider.MANAGER_ROLE()}`
      );

      await expect(
        stakeStarProvider.connect(manager).commitStakingBalance(2, 3)
      )
        .to.emit(stakeStarProvider, "CommitStakingBalance")
        .withArgs(2, 3);

      const latestStakingBalance2 =
        await stakeStarProvider.latestStakingBalance();

      expect(latestStakingBalance2.stakingBalance).to.eq(2);
      expect(latestStakingBalance2.timestamp).to.be.eq(3);

      await expect(
        stakeStarProvider.connect(manager).commitStakingBalance(1, 1)
      ).to.be.revertedWith("timestamp too old");
      await expect(
        stakeStarProvider.connect(manager).commitStakingBalance(1, 3)
      ).to.be.revertedWith("timestamp too old");
    });
  });
});
