import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ZERO } from "../scripts/constants";
import { deployStakeStarFixture } from "./fixture";
import { BigNumber } from "ethers";
import { ValidatorStatus } from "../scripts/types";

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
      const { stakeStarPublic, validatorParams1, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      const defaultAdminRole = await stakeStarPublic.DEFAULT_ADMIN_ROLE();
      const managerRole = await stakeStarPublic.MANAGER_ROLE();

      await expect(
        stakeStarPublic.setLocalPoolParameters(1, 1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(stakeStarPublic.setQueueParameters(1)).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.createValidator(validatorParams1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${managerRole}`
      );
      await expect(
        stakeStarPublic.updateValidator(validatorParams1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.destroyValidator(validatorParams1.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${managerRole}`
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

      const stakeAmountETH = BigNumber.from(1);
      const stakeAmountSS = await stakeStarPublic.ETH_to_ssETH(stakeAmountETH);

      await expect(
        stakeStarPublic.stake({ value: stakeAmountETH })
      ).to.changeEtherBalances(
        [otherAccount, stakeStarPublic],
        [stakeAmountETH.mul(-1), stakeAmountETH]
      );

      await expect(
        stakeStarPublic.stake({ value: stakeAmountETH })
      ).to.changeTokenBalance(stakeStarETH, otherAccount, stakeAmountSS);

      await expect(stakeStarPublic.stake({ value: stakeAmountETH }))
        .to.emit(stakeStarPublic, "Stake")
        .withArgs(otherAccount.address, stakeAmountETH, stakeAmountSS);
    });
  });

  describe("Unstake", function () {
    it("Should create pendingUnstake", async function () {
      const { stakeStarPublic, otherAccount, stakeStarETH } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeAmountEth = ethers.utils.parseEther("2");
      await stakeStarPublic.stake({ value: stakeAmountEth });
      const ssEthAmount = await stakeStarETH.balanceOf(otherAccount.address);

      expect(await stakeStarETH.totalSupply()).to.equal(ssEthAmount);

      const unstakeAmountSS = ssEthAmount.div(2);
      const unstakeAmountEth = await stakeStarPublic.ssETH_to_ETH(
        unstakeAmountSS
      );
      const shouldBeBurntSS = unstakeAmountSS;

      await expect(
        stakeStarPublic.unstake(unstakeAmountSS)
      ).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        shouldBeBurntSS.mul(-1)
      );

      expect(await stakeStarETH.totalSupply()).to.equal(
        ssEthAmount.sub(shouldBeBurntSS)
      );
      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(
        unstakeAmountEth
      );
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(unstakeAmountEth);

      expect(await stakeStarPublic.left()).to.equal(1);
      expect(await stakeStarPublic.right()).to.equal(2);
      expect(await stakeStarPublic.previous(2)).to.equal(1);
      expect(await stakeStarPublic.next(1)).to.equal(2);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        1
      );

      await stakeStarPublic.claim();

      expect(await stakeStarPublic.left()).to.equal(2);
      expect(await stakeStarPublic.right()).to.equal(2);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );
      expect(await stakeStarPublic.previous(1)).to.equal(0);
      expect(await stakeStarPublic.next(1)).to.equal(0);

      await expect(stakeStarPublic.unstake(unstakeAmountSS))
        .to.emit(stakeStarPublic, "Unstake")
        .withArgs(otherAccount.address, unstakeAmountSS, unstakeAmountEth);
    });

    it("unstake queue", async function () {
      const {
        stakeStarPublic,
        stakeStarManager,
        stakeStarOwner,
        otherAccount,
        manager,
        owner,
        validatorParams1,
        stakeStarRegistry,
        ssvToken,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarPublic.stake({ value: ethers.utils.parseEther("16") });
      await stakeStarManager.stake({ value: ethers.utils.parseEther("8") });
      await stakeStarOwner.stake({ value: ethers.utils.parseEther("8") });

      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }
      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      await stakeStarManager.createValidator(
        validatorParams1,
        await ssvToken.balanceOf(stakeStarManager.address)
      );

      await stakeStarOwner.unstake(ethers.utils.parseEther("8"));
      await stakeStarManager.unstake(ethers.utils.parseEther("8"));
      await stakeStarPublic.unstake(ethers.utils.parseEther("16"));

      expect(await stakeStarPublic.left()).to.equal(1);
      expect(await stakeStarPublic.right()).to.equal(4);

      for (let i = 1; i <= 3; i++) {
        expect(await stakeStarPublic.previous(i)).to.equal(i - 1);
        expect(await stakeStarPublic.next(i)).to.equal(i + 1);
      }

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: ethers.utils.parseEther("8"),
      });

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(1);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: ethers.utils.parseEther("8"),
      });

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(1);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(2);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );

      await stakeStarManager.claim();

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(1);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );
      expect(await stakeStarPublic.next(1)).to.equal(3);
      expect(await stakeStarPublic.previous(3)).to.equal(1);

      expect(await stakeStarPublic.left()).to.equal(1);
      expect(await stakeStarPublic.right()).to.equal(4);

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: ethers.utils.parseEther("16"),
      });

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(1);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        3
      );

      await stakeStarPublic.claim();
      await stakeStarOwner.claim();

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );

      expect(await stakeStarPublic.left()).to.equal(4);
      expect(await stakeStarPublic.right()).to.equal(4);

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(0);

      expect(await stakeStarPublic.next(4)).to.equal(0);
      expect(await stakeStarPublic.previous(4)).to.equal(0);
    });
  });

  describe("Claim", function () {
    it("Should finish pendingUnstake and send Ether", async function () {
      const {
        stakeStarManager,
        stakeStarPublic,
        stakeStarRegistry,
        ssvToken,
        validatorParams1,
        owner,
        otherAccount,
      } = await loadFixture(deployStakeStarFixture);
      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      const stakeAmount = ethers.utils.parseEther("32");
      const unstakeAmount = ethers.utils.parseEther("16");

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
        validatorParams1,
        await ssvToken.balanceOf(stakeStarManager.address)
      );

      await stakeStarPublic.unstake(unstakeAmount);

      await expect(stakeStarPublic.claim()).to.be.revertedWith(
        "lack of eth / queue length"
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

  describe("LocalPoolUnstake", function () {
    it("Should unstake from local pool in a single tx", async function () {
      const { stakeStarPublic, stakeStarOwner, otherAccount, stakeStarETH } =
        await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setLocalPoolParameters(
        ethers.utils.parseEther("2"),
        ethers.utils.parseEther("1"),
        3600
      );

      await stakeStarPublic.stake({ value: ethers.utils.parseEther("4") });

      await expect(
        stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("2"))
      ).to.be.revertedWith("localPoolUnstakeLimit");

      await expect(
        stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1"))
      ).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [ethers.utils.parseEther("1").mul(-1), ethers.utils.parseEther("1")]
      );

      expect(await stakeStarPublic.localPoolSize()).to.eq(
        ethers.utils.parseEther("1")
      );
      await expect(
        stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("lpuFrequencyLimit");

      await stakeStarOwner.setLocalPoolParameters(
        ethers.utils.parseEther("2"),
        ethers.utils.parseEther("1"),
        0
      );
      await stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1"));
      expect(await stakeStarPublic.localPoolSize()).to.eq(ZERO);

      await expect(
        stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("localPoolSize");

      await stakeStarPublic.unstake(ethers.utils.parseEther("2"));
      await stakeStarPublic.claim();

      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.eq(ZERO);

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(ZERO);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(ZERO);
    });

    it("LocalPoolUnstake when there is pending unstake", async function () {
      const { stakeStarPublic, stakeStarOwner, otherAccount, stakeStarETH } =
        await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setLocalPoolParameters(
        ethers.utils.parseEther("2"),
        ethers.utils.parseEther("1"),
        0
      );

      await otherAccount.sendTransaction({
        to: stakeStarPublic.address,
        value: ethers.utils.parseEther("10"),
      });

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("4"),
      });
      await stakeStarPublic.unstake(ethers.utils.parseEther("3"));
      await stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1"));
      await expect(
        stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });
      await expect(
        stakeStarPublic.unstake(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("one unstake at a time only");
      await stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1"));
      await stakeStarPublic.claim();

      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.eq(ZERO);

      expect(await stakeStarPublic.pendingUnstakeSum()).to.equal(ZERO);
      expect(
        await stakeStarPublic.pendingUnstake(otherAccount.address)
      ).to.equal(ZERO);
    });
  });

  describe("CreateValidator", function () {
    it("Should create a validator", async function () {
      const {
        stakeStarManager,
        ssvToken,
        stakeStarRegistry,
        validatorParams1,
        owner,
        manager,
      } = await loadFixture(deployStakeStarFixture);
      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarManager.address);

      await expect(
        stakeStarManager.createValidator(validatorParams1, ssvBalance)
      ).to.be.revertedWith("cannot create validator");

      await manager.sendTransaction({
        to: stakeStarManager.address,
        value: ethers.utils.parseEther("99"),
      });

      await expect(
        stakeStarManager.createValidator(validatorParams1, ssvBalance)
      ).to.be.revertedWith("operators not allowListed");

      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      await expect(
        stakeStarManager.createValidator(validatorParams1, ssvBalance)
      ).to.emit(stakeStarManager, "CreateValidator");
    });

    it("Should take into account balance, localPoolSize, pendingUnstakeSum", async function () {
      const {
        stakeStarOwner,
        stakeStarManager,
        stakeStarPublic,
        stakeStarRegistry,
        ssvToken,
        validatorParams1,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

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

      await stakeStarOwner.setLocalPoolParameters(1, 0, 0);
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
      await stakeStarManager.createValidator(validatorParams1, ssvBalance);

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

  describe("UpdateValidator", function () {
    it("Should update existing validator", async function () {
      const {
        stakeStarOwner,
        stakeStarManager,
        stakeStarRegistry,
        ssvToken,
        validatorParams1,
        owner,
        manager,
      } = await loadFixture(deployStakeStarFixture);

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarOwner.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarOwner.address);

      await manager.sendTransaction({
        to: stakeStarOwner.address,
        value: ethers.utils.parseEther("99"),
      });

      await expect(
        stakeStarOwner.updateValidator(validatorParams1, ssvBalance)
      ).to.be.revertedWith("validator missing");

      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      await expect(
        stakeStarManager.createValidator(validatorParams1, ssvBalance.div(2))
      ).to.emit(stakeStarManager, "CreateValidator");

      validatorParams1.operatorIds[0] = 127;

      await expect(
        stakeStarOwner.updateValidator(validatorParams1, ssvBalance)
      ).to.be.revertedWith("operators not allowListed");

      await stakeStarRegistry.connect(owner).addOperatorToAllowList(127);

      await expect(
        stakeStarOwner.updateValidator(validatorParams1, ssvBalance.div(2))
      ).to.emit(stakeStarOwner, "UpdateValidator");
    });
  });

  describe("DestroyValidator", function () {
    it("destroyValidator", async function () {
      const {
        stakeStarPublic,
        stakeStarManager,
        stakeStarRegistry,
        stakeStarRegistryManager,
        ssvToken,
        ssvNetwork,
        validatorParams1,
        hre,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      await stakeStarPublic.stake({ value: hre.ethers.utils.parseEther("32") });

      await stakeStarManager.createValidator(
        validatorParams1,
        (await ssvToken.balanceOf(stakeStarManager.address)).div(2)
      );

      await stakeStarPublic.unstake(hre.ethers.utils.parseEther("32"));

      await stakeStarRegistryManager.confirmActivatingValidator(
        validatorParams1.publicKey
      );

      const validatorToDestroy = await stakeStarManager.validatorToDestroy();
      expect(validatorToDestroy).to.eql(
        hre.ethers.utils.hexlify(await validatorParams1.publicKey)
      );

      await stakeStarRegistryManager.initiateExitingValidator(
        validatorToDestroy
      );

      expect(
        (await ssvNetwork.getValidatorsByOwnerAddress(stakeStarManager.address))
          .length
      ).to.be.greaterThan(0);

      await expect(stakeStarManager.destroyValidator(validatorToDestroy))
        .to.emit(stakeStarManager, "DestroyValidator")
        .withArgs(validatorToDestroy);

      expect(
        await stakeStarRegistry.validatorStatuses(validatorToDestroy)
      ).to.eql(ValidatorStatus.EXITED);

      expect(
        (await ssvNetwork.getValidatorsByOwnerAddress(stakeStarManager.address))
          .length
      ).to.be.eql(0);
    });

    it("validatorDestructionAvailability", async function () {
      const {
        stakeStarPublic,
        stakeStarManager,
        stakeStarOwner,
        stakeStarRegistry,
        stakeStarRegistryManager,
        stakeStarOracleManager,
        withdrawalAddress,
        ssvToken,
        validatorParams1,
        validatorParams2,
        hre,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .false;

      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      await stakeStarPublic.stake({ value: hre.ethers.utils.parseEther("64") });

      await stakeStarManager.createValidator(
        validatorParams1,
        (await ssvToken.balanceOf(stakeStarManager.address)).div(2)
      );
      await stakeStarManager.createValidator(
        validatorParams2,
        await ssvToken.balanceOf(stakeStarManager.address)
      );

      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .false;

      await stakeStarPublic.unstake(hre.ethers.utils.parseEther("32"));

      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .false;

      await stakeStarRegistryManager.confirmActivatingValidator(
        validatorParams1.publicKey
      );
      await stakeStarRegistryManager.confirmActivatingValidator(
        validatorParams2.publicKey
      );

      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .true;

      await stakeStarOwner.setLocalPoolParameters(1, 0, 0);

      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .false;

      await stakeStarOwner.setLocalPoolParameters(0, 0, 0);
      await owner.sendTransaction({
        to: withdrawalAddress.address,
        value: hre.ethers.utils.parseEther("32"),
      });

      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .false;

      await stakeStarOracleManager.save(100, hre.ethers.utils.parseEther("32"));
      await stakeStarManager.commitSnapshot();

      expect(
        await ethers.getDefaultProvider().getBalance(withdrawalAddress.address)
      ).to.equal(0);

      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .false;

      await stakeStarPublic.claim();
      await stakeStarPublic.unstake(hre.ethers.utils.parseEther("32"));
      expect(await stakeStarManager.validatorDestructionAvailability()).to.be
        .true;
    });

    it("validatorToDestroy", async function () {
      const {
        stakeStarPublic,
        stakeStarManager,
        stakeStarRegistry,
        stakeStarRegistryManager,
        ssvToken,
        validatorParams1,
        hre,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      await stakeStarPublic.stake({ value: hre.ethers.utils.parseEther("32") });

      await stakeStarManager.createValidator(
        validatorParams1,
        (await ssvToken.balanceOf(stakeStarManager.address)).div(2)
      );

      await expect(stakeStarPublic.validatorToDestroy()).to.be.revertedWith(
        "destroy not available"
      );

      await stakeStarPublic.unstake(hre.ethers.utils.parseEther("32"));

      await stakeStarRegistryManager.confirmActivatingValidator(
        validatorParams1.publicKey
      );

      const validatorToDestroy = await stakeStarManager.validatorToDestroy();
      expect(validatorToDestroy).to.eql(
        hre.ethers.utils.hexlify(await validatorParams1.publicKey)
      );

      await stakeStarRegistryManager.initiateExitingValidator(
        validatorToDestroy
      );

      await expect(stakeStarPublic.validatorToDestroy()).to.be.revertedWith(
        "destroy not available"
      );

      await stakeStarManager.destroyValidator(validatorToDestroy);

      await expect(stakeStarPublic.validatorToDestroy()).to.be.revertedWith(
        "destroy not available"
      );
    });
  });

  describe("harvest", function () {
    it("Should pull ETH from FeeRecipient and MevRecipient", async function () {
      const { stakeStarPublic, feeRecipient, mevRecipient, otherAccount } =
        await loadFixture(deployStakeStarFixture);
      const snapshot0before = await stakeStarPublic.snapshots(0);
      const snapshot1before = await stakeStarPublic.snapshots(1);

      await otherAccount.sendTransaction({
        to: feeRecipient.address,
        value: 122,
      });
      await otherAccount.sendTransaction({
        to: mevRecipient.address,
        value: 125,
      });

      await expect(stakeStarPublic.harvest()).to.changeEtherBalances(
        [feeRecipient, mevRecipient, stakeStarPublic],
        [-122, -125, 247]
      );

      const snapshot0after = await stakeStarPublic.snapshots(0);
      const snapshot1after = await stakeStarPublic.snapshots(1);

      expect(snapshot0before).to.eql(snapshot0after);
      expect(snapshot1before).to.eql(snapshot1after);

      await expect(stakeStarPublic.harvest()).to.changeEtherBalances(
        [feeRecipient, mevRecipient, stakeStarPublic],
        [0, 0, 0]
      );
    });
  });

  // describe("Linear approximation", function () {
  //   it("Should approximate ssETH rate", async function () {
  //     const {
  //       hre,
  //       stakeStarOwner,
  //       stakeStarPublic,
  //       otherAccount,
  //       stakeStarETH,
  //       stakeStarProvider,
  //       stakeStarProviderManager,
  //     } = await loadFixture(deployStakeStarFixture);
  //     await stakeStarProvider.setLimits(
  //       hre.ethers.utils.parseUnits("16"),
  //       hre.ethers.utils.parseUnits("40"),
  //       24 * 3600,
  //       hre.ethers.utils.parseUnits("99999"),
  //       3
  //     );
  //
  //     const currentTimestamp = (
  //       await hre.ethers.provider.getBlock(
  //         await hre.ethers.provider.getBlockNumber()
  //       )
  //     ).timestamp;
  //     const currentEpochNumber = Math.floor(
  //       (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
  //     );
  //
  //     const one = ethers.utils.parseEther("1");
  //     const oneHundred = ethers.utils.parseEther("100");
  //
  //     // some stake required because of division by zero
  //     await stakeStarPublic.stake({ value: oneHundred });
  //     // one to one
  //     const balance1 = await stakeStarETH.balanceOf(otherAccount.address);
  //     expect(balance1).to.equal(oneHundred);
  //
  //     const getTime = async function () {
  //       return (
  //         await hre.ethers.provider.getBlock(
  //           await hre.ethers.provider.getBlockNumber()
  //         )
  //       ).timestamp;
  //     };
  //     const initialTimestamp = await stakeStarProviderManager.epochTimestamp(
  //       currentEpochNumber
  //     );
  //
  //     // not initialized yet
  //     await expect(
  //       stakeStarPublic.approximateStakingSurplus(initialTimestamp)
  //     ).to.be.revertedWith("point A or B not initialized");
  //     expect(await stakeStarPublic.currentApproximateRate()).to.equal(one);
  //
  //     // distribute 0.01 first time
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 3,
  //       ethers.utils.parseEther("32.01"),
  //       1
  //     );
  //     await expect(stakeStarOwner.commitStakingSurplus())
  //       .to.emit(stakeStarOwner, "CommitStakingSurplus")
  //       .withArgs(
  //         ethers.utils.parseEther("0.01"),
  //         await stakeStarProviderManager.epochTimestamp(currentEpochNumber - 3)
  //       );
  //     // still not initialized yet (only one point)
  //     await expect(
  //       stakeStarPublic.approximateStakingSurplus(initialTimestamp)
  //     ).to.be.revertedWith("point A or B not initialized");
  //     expect(await stakeStarPublic.currentApproximateRate()).to.equal(one);
  //
  //     // distribute another 0.01
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 2,
  //       ethers.utils.parseEther("32.02"),
  //       1
  //     );
  //     await stakeStarOwner.commitStakingSurplus();
  //
  //     // two points initialized. If timestamp = last point, reward = last reward
  //     expect(
  //       await stakeStarPublic.approximateStakingSurplus(
  //         await stakeStarProviderManager.epochTimestamp(currentEpochNumber - 2)
  //       )
  //     ).to.equal(ethers.utils.parseEther("0.02"));
  //
  //     // 0.02 will be distributed by 100 staked ethers
  //     expect(await stakeStarETH.rate()).to.equal(
  //       ethers.utils
  //         .parseEther("100.02")
  //         .mul(one)
  //         .div(ethers.utils.parseEther("100"))
  //     );
  //
  //     // 2 epochs(384 * 2 seconds) spent with rate 0.01 ether / epoch
  //     expect(
  //       await stakeStarPublic.approximateStakingSurplus(initialTimestamp)
  //     ).to.equal(ethers.utils.parseEther("0.04"));
  //
  //     const getCurrentRate = async function (
  //       totalStakedEth: BigNumber,
  //       tm: number | undefined = undefined,
  //       totalStakedSS: BigNumber | undefined = undefined
  //     ) {
  //       totalStakedSS = totalStakedSS
  //         ? totalStakedSS
  //         : await stakeStarETH.totalSupply();
  //       tm = tm ? tm : await getTime();
  //
  //       // current reward = 0.01 / 250 * timedelta + 0.02
  //       const currentReward = ethers.utils
  //         .parseEther("0.01")
  //         .mul(tm - initialTimestamp)
  //         .div(384)
  //         .add(ethers.utils.parseEther("0.04"));
  //       expect(await stakeStarPublic.approximateStakingSurplus(tm)).to.equal(
  //         currentReward
  //       );
  //
  //       // so rate (totalStakedEth + currentReward) / total staked
  //       const currentRate = totalStakedEth
  //         .add(currentReward)
  //         .mul(one)
  //         .div(totalStakedSS);
  //
  //       return [currentRate, currentReward];
  //     };
  //
  //     await hre.network.provider.request({ method: "evm_mine", params: [] });
  //     let [currentRate] = await getCurrentRate(ethers.utils.parseEther("100"));
  //     expect(await stakeStarPublic.currentApproximateRate()).to.equal(
  //       currentRate
  //     );
  //
  //     await hre.network.provider.request({ method: "evm_mine", params: [] });
  //     [currentRate] = await getCurrentRate(ethers.utils.parseEther("100"));
  //     expect(await stakeStarPublic.currentApproximateRate()).to.equal(
  //       currentRate
  //     );
  //
  //     await hre.network.provider.send("evm_setNextBlockTimestamp", [
  //       initialTimestamp.toNumber() + 200,
  //     ]);
  //     await hre.network.provider.request({ method: "evm_mine", params: [] });
  //     await getCurrentRate(ethers.utils.parseEther("100"));
  //
  //     expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
  //       balance1
  //     );
  //
  //     // Another Stake 100
  //     const constRateBeforeStake = await stakeStarETH.rate();
  //     const tx = await stakeStarPublic.stake({
  //       value: ethers.utils.parseEther("100"),
  //     });
  //     // staking shouldn't change constant rate
  //     expect(await stakeStarETH.rate()).to.be.equal(constRateBeforeStake);
  //     const tx_timestamp = (await hre.ethers.provider.getBlock(tx.blockNumber))
  //       .timestamp;
  //     const tx_rate = await stakeStarPublic.approximateRate(tx_timestamp);
  //
  //     let [currentRateB] = await getCurrentRate(
  //       ethers.utils.parseEther("100"),
  //       tx_timestamp,
  //       balance1
  //     );
  //
  //     let newStaked = ethers.utils.parseEther("100").mul(one).div(currentRateB);
  //     const balance2 = await stakeStarETH.balanceOf(otherAccount.address);
  //     expect(balance2).to.equal(newStaked.add(balance1));
  //
  //     const totalStakedEth = balance2.mul(constRateBeforeStake).div(one);
  //     expect(totalStakedEth).to.be.equal(await stakeStarETH.totalSupplyEth());
  //     let [currentRateC] = await getCurrentRate(
  //       totalStakedEth.sub(ethers.utils.parseEther("0.02")),
  //       tx_timestamp,
  //       balance2
  //     );
  //     expect(currentRateC).to.be.equal(tx_rate);
  //
  //     await stakeStarPublic.unstake(newStaked);
  //     await stakeStarPublic.claim();
  //   });
  // });
  //
  // describe("reservedTreasuryCommission", function () {
  //   it("Should take commission on staking surplus", async function () {
  //     const {
  //       stakeStarOwner,
  //       stakeStarPublic,
  //       stakeStarETH,
  //       otherAccount,
  //       stakeStarProvider,
  //       stakeStarProviderManager,
  //       ssvToken,
  //       stakeStarManager,
  //       validatorParams1,
  //       stakeStarRegistry,
  //       stakeStarRegistryManager,
  //       stakeStarTreasury,
  //       owner,
  //       hre,
  //     } = await loadFixture(deployStakeStarFixture);
  //
  //     await stakeStarProvider.setLimits(
  //       hre.ethers.utils.parseUnits("16"),
  //       hre.ethers.utils.parseUnits("40"),
  //       24 * 3600,
  //       hre.ethers.utils.parseUnits("99999"),
  //       3
  //     );
  //
  //     const currentTimestamp = (
  //       await hre.ethers.provider.getBlock(
  //         await hre.ethers.provider.getBlockNumber()
  //       )
  //     ).timestamp;
  //     const currentEpochNumber = Math.floor(
  //       (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
  //     );
  //
  //     const thirtyTwoEthers = hre.ethers.utils.parseEther("32");
  //
  //     await expect(
  //       stakeStarPublic.stake({ value: thirtyTwoEthers })
  //     ).to.changeTokenBalance(stakeStarETH, otherAccount, thirtyTwoEthers);
  //
  //     await ssvToken
  //       .connect(owner)
  //       .transfer(
  //         stakeStarManager.address,
  //         await ssvToken.balanceOf(owner.address)
  //       );
  //     for (const operatorId of validatorParams1.operatorIds) {
  //       await stakeStarRegistry
  //         .connect(owner)
  //         .addOperatorToAllowList(operatorId);
  //     }
  //     await stakeStarManager.createValidator(
  //       validatorParams1,
  //       await ssvToken.balanceOf(stakeStarManager.address)
  //     );
  //     await stakeStarRegistryManager.confirmActivatingValidator(
  //       validatorParams1.publicKey
  //     );
  //
  //     await stakeStarTreasury.setCommission(50_000); // 50%
  //
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 10,
  //       ethers.utils.parseEther("32.00"),
  //       1
  //     );
  //     await stakeStarOwner.commitStakingSurplus();
  //
  //     expect(await stakeStarOwner.stakingSurplusA()).to.eq(0);
  //     expect(await stakeStarOwner.stakingSurplusB()).to.eq(0);
  //     expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(0);
  //
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 9,
  //       ethers.utils.parseEther("32.00"),
  //       1
  //     );
  //     await stakeStarOwner.commitStakingSurplus();
  //
  //     expect(await stakeStarOwner.stakingSurplusA()).to.eq(0);
  //     expect(await stakeStarOwner.stakingSurplusB()).to.eq(0);
  //     expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(0);
  //
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 8,
  //       ethers.utils.parseEther("32.000000000000000100"),
  //       1
  //     );
  //     await stakeStarOwner.commitStakingSurplus();
  //
  //     expect(await stakeStarOwner.stakingSurplusA()).to.eq(0);
  //     expect(await stakeStarOwner.stakingSurplusB()).to.eq(50);
  //     expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(50);
  //
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 7,
  //       ethers.utils.parseEther("32.000000000000000120"),
  //       1
  //     );
  //     await stakeStarOwner.commitStakingSurplus();
  //
  //     expect(await stakeStarOwner.stakingSurplusA()).to.eq(50);
  //     expect(await stakeStarOwner.stakingSurplusB()).to.eq(60);
  //     expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(60);
  //
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 6,
  //       ethers.utils.parseEther("32.000000000000000010"),
  //       1
  //     );
  //     await stakeStarOwner.commitStakingSurplus();
  //
  //     expect(await stakeStarOwner.stakingSurplusA()).to.eq(60);
  //     expect(await stakeStarOwner.stakingSurplusB()).to.eq(5);
  //     expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(5);
  //
  //     await stakeStarProviderManager.save(
  //       currentEpochNumber - 5,
  //       ethers.utils.parseEther("31.999999999999999880"),
  //       1
  //     );
  //     await stakeStarOwner.commitStakingSurplus();
  //
  //     expect(await stakeStarOwner.stakingSurplusA()).to.eq(5);
  //     expect(await stakeStarOwner.stakingSurplusB()).to.eq(-120);
  //     expect(await stakeStarOwner.reservedTreasuryCommission()).to.eq(0);
  //   });
  // });
});
