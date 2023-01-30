import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";

describe("StakeStarTreasury", function () {
  describe("Deployment", function () {
    it("Should set the right DEFAULT_ADMIN_ROLE", async function () {
      const { stakeStarTreasury, owner, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarTreasury.hasRole(
          await stakeStarTreasury.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarTreasury.hasRole(
          await stakeStarTreasury.DEFAULT_ADMIN_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow call methods without corresponding roles", async function () {
      const { stakeStarTreasury, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        stakeStarTreasury.connect(otherAccount).setCommission(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarTreasury.DEFAULT_ADMIN_ROLE()}`
      );
      await expect(
        stakeStarTreasury.connect(otherAccount).withdraw(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarTreasury.DEFAULT_ADMIN_ROLE()}`
      );
    });
  });

  describe("Payable", function () {
    it("Should receive Ether", async function () {
      const { stakeStarTreasury, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        otherAccount.sendTransaction({
          to: stakeStarTreasury.address,
          value: 1,
        })
      ).to.changeEtherBalances([otherAccount, stakeStarTreasury], [-1, 1]);
    });
  });

  describe("SetCommission", function () {
    it("Should set commissionNumerator", async function () {
      const { stakeStarTreasury } = await loadFixture(deployStakeStarFixture);

      expect(await stakeStarTreasury.commissionNumerator()).to.eq(0);
      expect(await stakeStarTreasury.commission(1000)).to.eq(0);

      await expect(stakeStarTreasury.setCommission(100_001)).to.be.revertedWith(
        `value must be in [0, 100_000]`
      );

      await stakeStarTreasury.setCommission(0);
      await stakeStarTreasury.setCommission(100_000);

      await expect(stakeStarTreasury.setCommission(7000))
        .to.emit(stakeStarTreasury, "SetCommission")
        .withArgs(7000);

      expect(await stakeStarTreasury.commissionNumerator()).to.eq(7000);
      expect(await stakeStarTreasury.commission(1000)).to.eq(70);
    });

    it("Should emit Pull event", async function () {
      const { stakeStarTreasury, owner, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await otherAccount.sendTransaction({
        to: stakeStarTreasury.address,
        value: 5000,
      });

      await expect(stakeStarTreasury.withdraw(5000))
        .to.emit(stakeStarTreasury, "Withdraw")
        .withArgs(5000);

      await otherAccount.sendTransaction({
        to: stakeStarTreasury.address,
        value: 6000,
      });

      await expect(stakeStarTreasury.withdraw(6000)).to.changeEtherBalances(
        [owner, stakeStarTreasury],
        [6000, -6000]
      );
    });
  });
});
