import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";
import { Wallet } from "ethers";
import { ZERO_BYTES_STRING } from "../scripts/constants";
import { ValidatorStatus } from "../scripts/types";

describe("StakeStarRewardsProvider", function () {
  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { stakeStarRewardsProvider, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await stakeStarRewardsProvider.hasRole(
          await stakeStarRewardsProvider.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarRewardsProvider.hasRole(
          await stakeStarRewardsProvider.DEFAULT_ADMIN_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow call methods without admin role", async function () {
      const { stakeStarRewardsProvider, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        stakeStarRewardsProvider.connect(otherAccount).provideRewards(123)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarRewardsProvider.DEFAULT_ADMIN_ROLE()}`
      );
    });
  });

  describe("Provide rewards", function () {
    it("Should store updated rewards", async function () {
      const { stakeStarRewardsProvider, owner } = await loadFixture(
        deployStakeStarFixture
      );

      const rewards = 123;

      await expect(stakeStarRewardsProvider.connect(owner).provideRewards(123))
        .to.emit(stakeStarRewardsProvider, "ProvideRewards")
        .withArgs(123);

      expect(await stakeStarRewardsProvider.getRewards()).to.equal(123);
    });
  });
});
