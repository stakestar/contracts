import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ZERO } from "../scripts/constants";
import { deployStakeStarFixture } from "./fixture";

describe("StakeStar", function () {
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { stakeStarPublic, owner } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarPublic.hasRole(
          await stakeStarPublic.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
    });

    it("Should set the right manager", async function () {
      const { stakeStarPublic, manager } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarPublic.hasRole(
          await stakeStarPublic.MANAGER_ROLE(),
          manager.address
        )
      ).to.equal(true);
    });

    it("Should set the right owner for ssETH", async function () {
      const { stakeStarPublic, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );
      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.STAKE_STAR_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(true);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow to call methods without corresponding roles", async function () {
      const { stakeStarPublic, validatorParams, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      const defaultAdminRole = await stakeStarPublic.DEFAULT_ADMIN_ROLE();
      const managerRole = await stakeStarPublic.MANAGER_ROLE();

      await expect(stakeStarPublic.setLocalPoolSize(1)).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.createValidator(validatorParams, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${managerRole}`
      );
      await expect(
        stakeStarPublic.destroyValidator(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${managerRole}`
      );
      await expect(stakeStarPublic.applyPenalties(1)).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
    });
  });

  describe("Stake", function () {
    it("Should send ETH to the contract", async function () {
      const { stakeStarPublic, stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarPublic.stake()).to.be.revertedWith(
        "no eth transferred"
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeEtherBalances(
        [otherAccount, stakeStarPublic],
        [-1, 1]
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(stakeStarPublic.stake({ value: 1 }))
        .to.emit(stakeStarPublic, "Stake")
        .withArgs(otherAccount.address, 1);
    });
  });

  describe("Unstake", function () {
    it("Should create pendingUnstake", async function () {
      const { stakeStarPublic, otherAccount, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeAmount = ethers.utils.parseEther("2");
      await stakeStarPublic.stake({ value: stakeAmount });
      const ssEthAmount = await stakeStarETH.balanceOf(otherAccount.address);

      expect(await stakeStarETH.totalSupply()).to.equal(ssEthAmount);

      const unstakeAmount = stakeAmount.div(2);
      const shouldBeBurnt = ssEthAmount.div(2);

      await expect(
        stakeStarPublic.unstake(unstakeAmount)
      ).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        shouldBeBurnt.mul(-1)
      );

      await expect(stakeStarPublic.unstake(unstakeAmount)).to.be.revertedWith(
        "unstake already pending"
      );

      expect(await stakeStarETH.totalSupply()).to.equal(
        ssEthAmount.sub(shouldBeBurnt)
      );
      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(unstakeAmount);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(unstakeAmount);

      await stakeStarPublic.claim();

      await expect(stakeStarPublic.unstake(unstakeAmount))
        .to.emit(stakeStarPublic, "Unstake")
        .withArgs(otherAccount.address, unstakeAmount);
    });
  });

  describe("Claim", function () {
    it("Should finish pendingUnstake and send Ether", async function () {
      const {
        stakeStarManager,
        stakeStarPublic,
        ssvToken,
        validatorParams,
        owner,
        otherAccount,
      } = await loadFixture(deployStakeStarFixture);

      const stakeAmount = ethers.utils.parseEther("32");
      const unstakeAmount = stakeAmount.div(2);

      await expect(stakeStarPublic.claim()).to.be.revertedWith(
        "no pending unstake"
      );

      await stakeStarPublic.stake({ value: stakeAmount });

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      await stakeStarManager.createValidator(
        validatorParams,
        await ssvToken.balanceOf(stakeStarManager.address)
      );

      await stakeStarPublic.unstake(unstakeAmount);

      await expect(stakeStarPublic.claim()).to.be.revertedWith(
        "failed to send Ether"
      );

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: stakeAmount,
      });

      await expect(stakeStarPublic.claim()).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [unstakeAmount.mul(-1), unstakeAmount]
      );

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(ZERO);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(ZERO);

      await stakeStarPublic.unstake(unstakeAmount);
      await expect(stakeStarPublic.claim())
        .to.emit(stakeStarPublic, "Claim")
        .withArgs(otherAccount.address, unstakeAmount);
    });
  });

  describe("UnstakeAndClaim", function () {
    it("Should unstake and claim in a single tx", async function () {
      const { stakeStarPublic, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeAmount = ethers.utils.parseEther("2");
      const unstakeAndClaimAmount = stakeAmount.div(2);

      await stakeStarPublic.stake({ value: stakeAmount });

      await expect(
        stakeStarPublic.unstakeAndClaim(unstakeAndClaimAmount)
      ).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [unstakeAndClaimAmount.mul(-1), unstakeAndClaimAmount]
      );

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(ZERO);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(ZERO);
    });
  });

  describe("CreateValidator", function () {
    it("Should create a validator", async function () {
      const { stakeStarManager, ssvToken, validatorParams, owner, manager } =
        await loadFixture(deployStakeStarFixture);

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarManager.address);

      await expect(
        stakeStarManager.createValidator(validatorParams, ssvBalance)
      ).to.be.revertedWith("cannot create validator");

      await manager.sendTransaction({
        to: stakeStarManager.address,
        value: ethers.utils.parseEther("99"),
      });

      await expect(
        stakeStarManager.createValidator(validatorParams, ssvBalance)
      ).to.emit(stakeStarManager, "CreateValidator");
    });

    it("Should take into account balance, localPoolSize, pendingUnstakeSum", async function () {
      const {
        stakeStarOwner,
        stakeStarManager,
        stakeStarPublic,
        ssvToken,
        validatorParams,
        owner,
      } = await loadFixture(deployStakeStarFixture);

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: ethers.utils.parseEther("32"),
      });

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );

      await stakeStarOwner.setLocalPoolSize(1);

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: 1,
      });

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );

      await stakeStarPublic.stake({ value: ethers.utils.parseEther("32") });

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarOwner.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarOwner.address);
      await stakeStarManager.createValidator(validatorParams, ssvBalance);

      await stakeStarPublic.unstake(ethers.utils.parseEther("32"));

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: ethers.utils.parseEther("32"),
      });

      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );
    });
  });

  describe("DestroyValidator", function () {
    it("Should revert unless implemented", async function () {
      const { stakeStarManager, validatorParams } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(
        stakeStarManager.destroyValidator(validatorParams.publicKey)
      ).to.be.revertedWith("not implemented");
      await expect(
        stakeStarManager.validatorDestructionAvailability()
      ).to.be.revertedWith("not implemented");
    });
  });

  describe("applyRewards", function () {
    it("Should pull rewards from StakeStarRewards", async function () {
      const { stakeStarPublic, stakeStarRewards, stakeStarETH, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await expect(stakeStarPublic.applyRewards()).to.be.revertedWith(
        "no rewards available"
      );

      const rateBefore = await stakeStarETH.rate();

      await stakeStarPublic.stake({ value: 1 });

      await otherAccount.sendTransaction({
        to: stakeStarRewards.address,
        value: 1,
      });
      await expect(stakeStarPublic.applyRewards()).to.changeEtherBalances(
        [stakeStarPublic, stakeStarRewards],
        [1, -1]
      );

      const rateAfter = await stakeStarETH.rate();
      expect(rateAfter.gt(rateBefore)).to.equal(true);

      await otherAccount.sendTransaction({
        to: stakeStarRewards.address,
        value: 1,
      });
      await expect(stakeStarPublic.applyRewards())
        .to.emit(stakeStarPublic, "ApplyRewards")
        .withArgs(1);
    });
  });

  describe("applyPenalties", function () {
    it("Should decrease StakeStarETH rate", async function () {
      const { stakeStarOwner, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarOwner.applyPenalties(0)).to.be.revertedWith(
        "cannot apply zero penalty"
      );

      await stakeStarOwner.stake({ value: 100 });

      const rateBefore = await stakeStarETH.rate();

      await expect(stakeStarOwner.applyPenalties(1))
        .to.emit(stakeStarOwner, "ApplyPenalties")
        .withArgs(1);

      const rateAfter = await stakeStarETH.rate();
      expect(rateAfter.lt(rateBefore)).to.equal(true);
    });
  });
});
