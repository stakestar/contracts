import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture/fixture";
import { ethers } from "hardhat";
import { ConstantsLib } from "../../scripts/constants";

describe("ETHReceiver", function () {
  describe("Deployment", function () {
    it("Should set the right STAKE_STAR_ROLE", async function () {
      const { stakeStarPublic, feeRecipient, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await feeRecipient.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await feeRecipient.hasRole(ConstantsLib.STAKE_STAR_ROLE, owner.address)
      ).to.equal(false);
      expect(
        await feeRecipient.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await feeRecipient.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(false);
      expect(
        await feeRecipient.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          owner.address
        )
      ).to.equal(true);
      expect(
        await feeRecipient.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          otherAccount.address
        )
      ).to.equal(false);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow to call methods without corresponding roles", async function () {
      const { feeRecipient, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        feeRecipient.connect(otherAccount).pull()
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.STAKE_STAR_ROLE
        }`
      );
    });
  });

  describe("Payable", function () {
    it("Should receive Ether", async function () {
      const { feeRecipient, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        otherAccount.sendTransaction({ to: feeRecipient.address, value: 1 })
      ).to.changeEtherBalances([otherAccount, feeRecipient], [-1, 1]);
    });
  });

  describe("Pull", function () {
    it("Should send Ether to StakeStar only", async function () {
      const { feeRecipient, owner, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const value = 100;
      await otherAccount.sendTransaction({
        to: feeRecipient.address,
        value: value,
      });

      await feeRecipient.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);

      await expect(feeRecipient.pull()).to.changeEtherBalances(
        [owner, feeRecipient],
        [value, value * -1]
      );

      expect(
        await ethers.getDefaultProvider().getBalance(feeRecipient.address)
      ).to.equal(0);

      await otherAccount.sendTransaction({
        to: feeRecipient.address,
        value: value,
      });
      await expect(feeRecipient.pull())
        .to.emit(feeRecipient, "Pull")
        .withArgs(owner.address, value);
    });
  });
});
