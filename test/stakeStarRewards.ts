import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";
import { ethers } from "hardhat";

describe("StakeStarRewards", function () {
  describe("Deployment", function () {
    it("Should set the right STAKE_STAR_ROLE", async function () {
      const { stakeStarPublic, stakeStarRewards, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await stakeStarRewards.hasRole(
          await stakeStarRewards.STAKE_STAR_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await stakeStarRewards.hasRole(
          await stakeStarRewards.STAKE_STAR_ROLE(),
          owner.address
        )
      ).to.equal(false);
      expect(
        await stakeStarRewards.hasRole(
          await stakeStarRewards.STAKE_STAR_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await stakeStarRewards.hasRole(
          await stakeStarRewards.DEFAULT_ADMIN_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(false);
      expect(
        await stakeStarRewards.hasRole(
          await stakeStarRewards.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarRewards.hasRole(
          await stakeStarRewards.DEFAULT_ADMIN_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);
    });
  });

  describe("Payable", function () {
    it("Should receive Ether", async function () {
      const { stakeStarRewards, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        otherAccount.sendTransaction({ to: stakeStarRewards.address, value: 1 })
      ).to.changeEtherBalances([otherAccount, stakeStarRewards], [-1, 1]);
    });
  });

  describe("Pull", function () {
    it("Should send Ether to StakeStar only", async function () {
      const { stakeStarOwner, stakeStarRewards, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await stakeStarOwner.stake({ value: 1 });

      const rewards = 100;
      await otherAccount.sendTransaction({
        to: stakeStarRewards.address,
        value: rewards,
      });

      await expect(stakeStarRewards.connect(owner).pull()).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarRewards.STAKE_STAR_ROLE()}`
      );
      await expect(
        stakeStarRewards.connect(otherAccount).pull()
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarRewards.STAKE_STAR_ROLE()}`
      );

      await expect(stakeStarOwner.harvest()).to.changeEtherBalances(
        [stakeStarOwner, stakeStarRewards],
        [rewards, rewards * -1]
      );

      expect(
        await ethers.getDefaultProvider().getBalance(stakeStarRewards.address)
      ).to.equal(0);
    });

    it("Should emit Pull event", async function () {
      const { stakeStarOwner, stakeStarRewards, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await stakeStarOwner.stake({ value: 1 });

      const rewards = 100;
      await otherAccount.sendTransaction({
        to: stakeStarRewards.address,
        value: rewards,
      });

      await expect(stakeStarOwner.harvest())
        .to.emit(stakeStarRewards, "Pull")
        .withArgs(stakeStarOwner.address, rewards);
    });
  });
});
