import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { ConstantsLib, EPOCHS, ZERO } from "../scripts/constants";
import { deployStakeStarFixture } from "./fixture/fixture";
import { BigNumber } from "ethers";
import { ValidatorStatus } from "../scripts/types";
import { currentNetwork, humanify } from "../scripts/helpers";
import { BlockTag } from "@ethersproject/providers";

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
          ConstantsLib.MANAGER_ROLE,
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
          ConstantsLib.STAKE_STAR_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(true);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow to call methods without corresponding roles", async function () {
      const { stakeStarPublic, validatorParams1, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      const defaultAdminRole = ConstantsLib.DEFAULT_ADMIN_ROLE;
      const managerRole = ConstantsLib.MANAGER_ROLE;

      await expect(
        stakeStarPublic.setAddresses(
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address,
          stakeStarPublic.address
        )
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.setRateParameters(1, false)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.setLocalPoolParameters(1, 1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(stakeStarPublic.setQueueParameters(1)).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(stakeStarPublic.reactivateAccount()).to.be.revertedWith(
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

  describe("Setters", function () {
    describe("setAddresses", function () {
      it("Should setAddresses", async function () {
        const {
          stakeStarOwner,
          addresses,
          stakeStarOracle,
          stakeStarETH,
          stakeStarRegistry,
          stakeStarTreasury,
          withdrawalAddress,
          feeRecipient,
          mevRecipient,
        } = await loadFixture(deployStakeStarFixture);

        await expect(
          stakeStarOwner.setAddresses(
            addresses.depositContract,
            addresses.ssvNetwork,
            addresses.ssvToken,
            stakeStarOracle.address,
            stakeStarETH.address,
            stakeStarRegistry.address,
            stakeStarTreasury.address,
            withdrawalAddress.address,
            feeRecipient.address,
            mevRecipient.address
          )
        )
          .to.emit(stakeStarOwner, "SetAddresses")
          .withArgs(
            addresses.depositContract,
            addresses.ssvNetwork,
            addresses.ssvToken,
            stakeStarOracle.address,
            stakeStarETH.address,
            stakeStarRegistry.address,
            stakeStarTreasury.address,
            withdrawalAddress.address,
            feeRecipient.address,
            mevRecipient.address
          );

        expect(await stakeStarOwner.depositContract()).to.eql(
          addresses.depositContract
        );
        expect(await stakeStarOwner.ssvNetwork()).to.eql(addresses.ssvNetwork);
        expect(await stakeStarOwner.ssvToken()).to.eql(addresses.ssvToken);
        expect(await stakeStarOwner.oracleNetwork()).to.eql(
          stakeStarOracle.address
        );
        expect(await stakeStarOwner.stakeStarETH()).to.eql(
          stakeStarETH.address
        );
        expect(await stakeStarOwner.stakeStarRegistry()).to.eql(
          stakeStarRegistry.address
        );
        expect(await stakeStarOwner.stakeStarTreasury()).to.eql(
          stakeStarTreasury.address
        );
        expect(await stakeStarOwner.withdrawalAddress()).to.eql(
          withdrawalAddress.address
        );
        expect(await stakeStarOwner.feeRecipient()).to.eql(
          feeRecipient.address
        );
        expect(await stakeStarOwner.mevRecipient()).to.eql(
          mevRecipient.address
        );
      });
    });

    describe("setRateParameters", function () {
      it("Should setRateParameters", async function () {
        const { stakeStarOwner } = await loadFixture(deployStakeStarFixture);

        expect(await stakeStarOwner.maxRateDeviation()).to.equal(500);
        expect(await stakeStarOwner.rateDeviationCheck()).to.equal(true);

        await expect(stakeStarOwner.setRateParameters(100_000, false))
          .to.emit(stakeStarOwner, "SetRateParameters")
          .withArgs(100_000, false);

        expect(await stakeStarOwner.maxRateDeviation()).to.equal(100_000);
        expect(await stakeStarOwner.rateDeviationCheck()).to.equal(false);
      });
    });

    describe("setLocalPoolParameters", function () {
      it("Should setLocalPoolParameters", async function () {
        const { stakeStarOwner } = await loadFixture(deployStakeStarFixture);

        expect(await stakeStarOwner.localPoolMaxSize()).to.equal(0);
        expect(await stakeStarOwner.localPoolUnstakeLimit()).to.equal(0);
        expect(await stakeStarOwner.localPoolUnstakeFrequencyLimit()).to.equal(
          0
        );

        await expect(stakeStarOwner.setLocalPoolParameters(1, 2, 3))
          .to.emit(stakeStarOwner, "SetLocalPoolParameters")
          .withArgs(1, 2, 3);
        expect(await stakeStarOwner.localPoolMaxSize()).to.equal(1);
        expect(await stakeStarOwner.localPoolUnstakeLimit()).to.equal(2);
        expect(await stakeStarOwner.localPoolUnstakeFrequencyLimit()).to.equal(
          3
        );

        await stakeStarOwner.setLocalPoolParameters(100, 2, 3);
        expect(await stakeStarOwner.localPoolSize()).to.equal(0);
        await stakeStarOwner.stake({ value: 100 });
        expect(await stakeStarOwner.localPoolSize()).to.equal(100);
        await stakeStarOwner.setLocalPoolParameters(50, 2, 3);
        expect(await stakeStarOwner.localPoolSize()).to.equal(50);
      });
    });

    describe("setQueueParameters", function () {
      it("Should setQueueParameters", async function () {
        const { stakeStarOwner } = await loadFixture(deployStakeStarFixture);

        expect(await stakeStarOwner.loopLimit()).to.eql(25);
        await expect(stakeStarOwner.setQueueParameters(30))
          .to.emit(stakeStarOwner, "SetQueueParameters")
          .withArgs(30);
        expect(await stakeStarOwner.loopLimit()).to.eql(30);
      });
    });
  });

  describe("Stake", function () {
    it("Should send ETH to the contract", async function () {
      const { stakeStarPublic, stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarPublic.stake()).to.be.revertedWith("zero value");

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
      ).to.be.revertedWith("localPoolUnstakeFrequencyLimit");

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

    it("Should take into account balance, pendingUnstakeSum, localPoolSize", async function () {
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
        value: ethers.utils.parseEther("31"),
      });
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await stakeStarOwner.setLocalPoolParameters(
        ethers.utils.parseEther("3"),
        ethers.utils.parseEther("1"),
        10
      );
      await stakeStarPublic.stake({ value: ethers.utils.parseEther("3") });
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );
      await stakeStarPublic.stake({ value: ethers.utils.parseEther("1") });
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

    describe("validatorDestructionAvailability", function () {
      it("16 eth limit", async function () {
        const {
          stakeStarPublic,
          stakeStarManager,
          stakeStarRegistry,
          stakeStarRegistryManager,
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

        await stakeStarPublic.stake({
          value: hre.ethers.utils.parseEther("64"),
        });

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

        await owner.sendTransaction({
          to: stakeStarManager.address,
          value: hre.ethers.utils.parseEther("32"),
        });
        await stakeStarPublic.claim();

        await stakeStarPublic.unstake(hre.ethers.utils.parseEther("14"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;
        await owner.sendTransaction({
          to: stakeStarManager.address,
          value: hre.ethers.utils.parseEther("14"),
        });
        await stakeStarPublic.claim();

        await stakeStarPublic.unstake(hre.ethers.utils.parseEther("16"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .true;
      });

      it("takes pendingUnstakeSum, localPoolSize, WA, feeRecipient, mevRecipient, free eth", async function () {
        const {
          stakeStarPublic,
          stakeStarManager,
          stakeStarOwner,
          stakeStarRegistry,
          stakeStarRegistryManager,
          ssvToken,
          validatorParams1,
          validatorParams2,
          hre,
          owner,
          withdrawalAddress,
          feeRecipient,
          mevRecipient,
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

        await stakeStarPublic.stake({
          value: hre.ethers.utils.parseEther("64"),
        });

        await stakeStarManager.createValidator(
          validatorParams1,
          (await ssvToken.balanceOf(stakeStarManager.address)).div(2)
        );
        await stakeStarManager.createValidator(
          validatorParams2,
          await ssvToken.balanceOf(stakeStarManager.address)
        );

        await stakeStarRegistryManager.confirmActivatingValidator(
          validatorParams1.publicKey
        );
        await stakeStarRegistryManager.confirmActivatingValidator(
          validatorParams2.publicKey
        );

        await stakeStarOwner.setLocalPoolParameters(
          hre.ethers.utils.parseEther("2"),
          0,
          0
        );
        await stakeStarOwner.stake({ value: hre.ethers.utils.parseEther("1") });
        await stakeStarManager.stake({
          value: hre.ethers.utils.parseEther("1"),
        });

        await owner.sendTransaction({
          to: withdrawalAddress.address,
          value: hre.ethers.utils.parseEther("0.1"),
        });
        await owner.sendTransaction({
          to: feeRecipient.address,
          value: hre.ethers.utils.parseEther("0.01"),
        });
        await owner.sendTransaction({
          to: mevRecipient.address,
          value: hre.ethers.utils.parseEther("0.001"),
        });

        // 2 validators in Cons Layer: 2 active, 0 exiting
        // localPoolSize = 2 eth
        // balances: WA - 0.1 eth, FR - 0.01 eth, MR - 0.001 eth
        await stakeStarPublic.unstake(hre.ethers.utils.parseEther("16"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;
        await stakeStarOwner.unstake(hre.ethers.utils.parseEther("0.110"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;
        await stakeStarManager.unstake(hre.ethers.utils.parseEther("0.001"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .true;
      });

      it("takes pendingUnstakeSum, exitingETH", async function () {
        const {
          stakeStarPublic,
          stakeStarManager,
          stakeStarRegistry,
          stakeStarRegistryManager,
          ssvToken,
          validatorParams1,
          validatorParams2,
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

        await stakeStarPublic.stake({
          value: hre.ethers.utils.parseEther("64"),
        });

        await stakeStarManager.createValidator(
          validatorParams1,
          (await ssvToken.balanceOf(stakeStarManager.address)).div(2)
        );
        await stakeStarManager.createValidator(
          validatorParams2,
          await ssvToken.balanceOf(stakeStarManager.address)
        );

        await stakeStarRegistryManager.confirmActivatingValidator(
          validatorParams1.publicKey
        );
        await stakeStarRegistryManager.confirmActivatingValidator(
          validatorParams2.publicKey
        );

        await stakeStarPublic.unstake(hre.ethers.utils.parseEther("16"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .true;

        // 2 validators in Cons Layer: 0 active, 1 exiting
        // localPoolSize = 0 eth
        // balances: WA - 0 eth, FR - 0 eth, MR - 0 eth
        await stakeStarRegistryManager.initiateExitingValidator(
          validatorParams1.publicKey
        );
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;
      });
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

  describe("CommitSnapshot", function () {
    it("Should do basic validations and save snapshot", async function () {
      const { stakeStarPublic, stakeStarOracleManager } = await loadFixture(
        deployStakeStarFixture
      );

      await stakeStarOracleManager.save(1, ethers.utils.parseEther("0.001"));
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "totals must be > 0"
      );

      await stakeStarPublic.stake({ value: ethers.utils.parseEther("1") });
      await expect(stakeStarPublic.commitSnapshot())
        .to.emit(stakeStarPublic, "CommitSnapshot")
        .withArgs(
          ethers.utils.parseEther("1.001"),
          ethers.utils.parseEther("1"),
          await stakeStarOracleManager.epochTimestamp(1),
          ethers.utils.parseEther("1.001")
        );

      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "timestamps too close"
      );

      await stakeStarOracleManager.save(2, ethers.utils.parseEther("0.002"));
      await stakeStarPublic.commitSnapshot();

      await stakeStarOracleManager.save(3, ethers.utils.parseEther("0.003"));
      await stakeStarPublic.commitSnapshot();

      const snapshot0 = await stakeStarPublic.snapshots(0);
      const snapshot1 = await stakeStarPublic.snapshots(1);

      expect(snapshot0.total_ETH).to.equal(ethers.utils.parseEther("1.002"));
      expect(snapshot1.total_ETH).to.equal(ethers.utils.parseEther("1.003"));
      expect(snapshot0.total_ssETH).to.equal(ethers.utils.parseEther("1"));
      expect(snapshot1.total_ssETH).to.equal(ethers.utils.parseEther("1"));
      expect(snapshot0.timestamp).to.equal(
        await stakeStarOracleManager.epochTimestamp(2)
      );
      expect(snapshot1.timestamp).to.equal(
        await stakeStarOracleManager.epochTimestamp(3)
      );
    });

    it("Should pull fees before calculations", async function () {
      const {
        stakeStarPublic,
        otherAccount,
        stakeStarOracleManager,
        feeRecipient,
        mevRecipient,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarPublic.stake({ value: ethers.utils.parseEther("1") });

      await otherAccount.sendTransaction({
        value: ethers.utils.parseEther("0.001"),
        to: feeRecipient.address,
      });
      await otherAccount.sendTransaction({
        value: ethers.utils.parseEther("0.0001"),
        to: mevRecipient.address,
      });

      await stakeStarOracleManager.save(1, ethers.utils.parseEther("0.00001"));

      await expect(stakeStarPublic.commitSnapshot())
        .to.emit(stakeStarPublic, "CommitSnapshot")
        .withArgs(
          ethers.utils.parseEther("1.00111"),
          ethers.utils.parseEther("1"),
          await stakeStarOracleManager.epochTimestamp(1),
          ethers.utils.parseEther("1.00111")
        );

      const snapshot1 = await stakeStarPublic.snapshots(1);
      expect(snapshot1.total_ETH).to.equal(ethers.utils.parseEther("1.00111"));
      expect(snapshot1.total_ssETH).to.equal(ethers.utils.parseEther("1"));
      expect(snapshot1.timestamp).to.equal(
        await stakeStarOracleManager.epochTimestamp(1)
      );

      expect(
        await stakeStarPublic.provider.getBalance(stakeStarPublic.address)
      ).to.equal(ethers.utils.parseEther("1.0011"));
    });

    it("Should WA after calculations", async function () {
      const {
        stakeStarPublic,
        otherAccount,
        stakeStarOracleManager,
        withdrawalAddress,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarPublic.stake({ value: ethers.utils.parseEther("1") });

      await otherAccount.sendTransaction({
        value: ethers.utils.parseEther("0.0001"),
        to: withdrawalAddress.address,
      });

      await stakeStarOracleManager.save(1, ethers.utils.parseEther("0.0001"));

      await expect(stakeStarPublic.commitSnapshot())
        .to.emit(stakeStarPublic, "CommitSnapshot")
        .withArgs(
          ethers.utils.parseEther("1.0001"),
          ethers.utils.parseEther("1"),
          await stakeStarOracleManager.epochTimestamp(1),
          ethers.utils.parseEther("1.0001")
        );

      const snapshot1 = await stakeStarPublic.snapshots(1);
      expect(snapshot1.total_ETH).to.equal(ethers.utils.parseEther("1.0001"));
      expect(snapshot1.total_ssETH).to.equal(ethers.utils.parseEther("1"));
      expect(snapshot1.timestamp).to.equal(
        await stakeStarOracleManager.epochTimestamp(1)
      );

      expect(
        await stakeStarPublic.provider.getBalance(stakeStarPublic.address)
      ).to.equal(ethers.utils.parseEther("1.0001"));
    });

    it("maxRateDeviation", async function () {
      const {
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleManager,
        stakeStarRegistry,
        validatorParams1,
        ssvToken,
        stakeStarManager,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100, true); // 0.1%

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("32"),
      });
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
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarOracleManager.save(139_001, ethers.utils.parseEther("32")); // base
      await stakeStarPublic.commitSnapshot();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarOracleManager.save(
        139_002,
        ethers.utils.parseEther("32").mul(10011).div(10000)
      ); // 0.11% increase
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "rate deviation too big"
      );
      await stakeStarOracleManager.save(
        139_003,
        ethers.utils.parseEther("32").mul(9989).div(10000)
      ); // 0.11% decrease
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "rate deviation too big"
      );

      await stakeStarOracleManager.save(
        139_004,
        ethers.utils.parseEther("32").mul(9990).div(10000)
      ); // 0.1% decrease
      await stakeStarPublic.commitSnapshot();
      await stakeStarOracleManager.save(
        139_005,
        ethers.utils.parseEther("32").mul(9990).div(10000).mul(10010).div(10000)
      ); // 0.1% increase
      await stakeStarPublic.commitSnapshot();

      await stakeStarOracleManager.save(
        139_006,
        ethers.utils.parseEther("100")
      ); // massive increase
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "rate deviation too big"
      );
      await stakeStarOwner.setRateParameters(1000, false); // disable check
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic.rateDeviationCheck()).to.be.true;
    });
  });

  describe("Linear approximation by Sasha U. Kind of legacy test", function () {
    it("Should approximate ssETH rate", async function () {
      const {
        hre,
        stakeStarOwner,
        stakeStarPublic,
        otherAccount,
        stakeStarETH,
        stakeStarOracleManager,
      } = await loadFixture(deployStakeStarFixture);
      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;
      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );

      const one = ethers.utils.parseEther("1");
      const oneHundred = ethers.utils.parseEther("100");

      await stakeStarOwner.setRateParameters(100_000, true);

      // some stake required because of division by zero
      await stakeStarPublic.stake({ value: oneHundred });
      // one to one
      const balance1 = await stakeStarETH.balanceOf(otherAccount.address);
      expect(balance1).to.equal(oneHundred);

      const getTime = async function () {
        return (
          await hre.ethers.provider.getBlock(
            await hre.ethers.provider.getBlockNumber()
          )
        ).timestamp;
      };
      const initialTimestamp = await stakeStarOracleManager.epochTimestamp(
        currentEpochNumber
      );

      // not initialized yet
      expect(await stakeStarPublic["rate()"]()).to.equal(one);

      // distribute 0.01 first time
      await stakeStarOracleManager.save(
        currentEpochNumber - 3,
        ethers.utils.parseEther("0.01")
      );
      await expect(stakeStarOwner.commitSnapshot())
        .to.emit(stakeStarOwner, "CommitSnapshot")
        .withArgs(
          ethers.utils.parseEther("100.01"),
          ethers.utils.parseEther("100"),
          await stakeStarOracleManager.epochTimestamp(currentEpochNumber - 3),
          ethers.utils
            .parseEther("100.01")
            .mul(ethers.utils.parseEther("1"))
            .div(ethers.utils.parseEther("100"))
        );
      // still not initialized yet (only one point), so return rate from the only one point
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils
          .parseEther("100.01")
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("100"))
      );

      // // distribute another 0.01
      await stakeStarOracleManager.save(
        currentEpochNumber - 2,
        ethers.utils.parseEther("0.02")
      );
      await stakeStarOwner.commitSnapshot();

      // two points initialized. If timestamp = last point, reward = last reward
      // 0.02 will be distributed by 100 staked ethers
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(currentEpochNumber - 2)
        )
      ).to.equal(
        ethers.utils
          .parseEther("100.02")
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("100"))
      );

      // 2 epochs(384 * 2 seconds) spent with rate 0.01 ether / epoch
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(currentEpochNumber)
        )
      ).to.equal(
        ethers.utils
          .parseEther("100.04")
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("100"))
      );

      const getCurrentRate = async function (
        totalStakedEth: BigNumber,
        tm: number | undefined = undefined,
        totalStakedSS: BigNumber | undefined = undefined
      ) {
        totalStakedSS = totalStakedSS
          ? totalStakedSS
          : await stakeStarETH.totalSupply();
        tm = tm ? tm : await getTime();

        // current reward = 0.01 / 250 * timedelta + 0.02
        const currentReward = ethers.utils
          .parseEther("0.01")
          .mul(tm - initialTimestamp.toNumber())
          .div(384)
          .add(ethers.utils.parseEther("0.04"));

        // so rate (totalStakedEth + currentReward) / total staked
        const currentRate = totalStakedEth
          .add(currentReward)
          .mul(one)
          .div(totalStakedSS);

        expect(await stakeStarPublic["rate()"]()).to.equal(currentRate);

        return [currentRate, currentReward];
      };

      await hre.network.provider.request({ method: "evm_mine", params: [] });
      let [currentRate] = await getCurrentRate(ethers.utils.parseEther("100"));
      expect(await stakeStarPublic["rate()"]()).to.equal(currentRate);

      await hre.network.provider.request({ method: "evm_mine", params: [] });
      [currentRate] = await getCurrentRate(ethers.utils.parseEther("100"));
      expect(await stakeStarPublic["rate()"]()).to.equal(currentRate);

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        initialTimestamp.toNumber() + 200,
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });
      await getCurrentRate(ethers.utils.parseEther("100"));

      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        balance1
      );

      // Another Stake 100
      const tx = await stakeStarPublic.stake({
        value: ethers.utils.parseEther("100"),
      });
      const tx_timestamp = (
        await hre.ethers.provider.getBlock(tx.blockNumber as BlockTag)
      ).timestamp;

      let [currentRateB] = await getCurrentRate(
        ethers.utils.parseEther("100"),
        tx_timestamp,
        balance1
      );

      let newStaked = ethers.utils.parseEther("100").mul(one).div(currentRateB);
      const balance2 = await stakeStarETH.balanceOf(otherAccount.address);
      expect(balance2).to.equal(newStaked.add(balance1));

      await stakeStarPublic.unstake(newStaked);
      await stakeStarPublic.claim();
    });
  });

  describe("Rate", function () {
    it("Rate shouldn't change before any oracles submissions and be equal 1 ether", async function () {
      const { stakeStarPublic, stakeStarOwner, stakeStarETH, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1.23"),
      });
      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        ethers.utils.parseEther("1.23")
      );
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarPublic.unstake(ethers.utils.parseEther("1.23"));
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await stakeStarETH.totalSupply()).to.equal(0);

      await stakeStarPublic.claim();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarOwner.setLocalPoolParameters(
        ethers.utils.parseEther("1.23"),
        ethers.utils.parseEther("1.23"),
        1
      );
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1.23"),
      });
      await stakeStarPublic.localPoolUnstake(ethers.utils.parseEther("1.23"));
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await stakeStarETH.totalSupply()).to.equal(0);
    });

    it("Rate should be equal last snapshot rate(> 1) if only one snapshot submitted", async function () {
      const {
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleManager,
        stakeStarETH,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarOracleManager.save(1, 1);
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "totals must be > 0"
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("2"),
      });
      await stakeStarOracleManager.save(2, ethers.utils.parseEther("0.2"));
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1.1")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("2"),
      });
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1.1")
      );
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("4.2"), 1e9);
      expect(
        (await stakeStarETH.totalSupply())
          .mul(ethers.utils.parseEther("1.1"))
          .div(ethers.utils.parseEther("1"))
      ).to.be.closeTo(ethers.utils.parseEther("4.2"), 1e9);

      await stakeStarPublic.unstake(ethers.utils.parseEther("2"));
      await stakeStarPublic.claim();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1.1")
      );
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("2"), 1e9);
      expect(
        (await stakeStarETH.totalSupply())
          .mul(ethers.utils.parseEther("1.1"))
          .div(ethers.utils.parseEther("1"))
      ).to.be.closeTo(ethers.utils.parseEther("2"), 1e9);
    });

    it("Rate should be equal last snapshot rate(< 1) if only one snapshot submitted", async function () {
      const {
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleManager,
        stakeStarETH,
        stakeStarRegistry,
        validatorParams1,
        ssvToken,
        stakeStarManager,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("32"),
      });
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

      await stakeStarOracleManager.save(1, ethers.utils.parseEther("16"));
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("0.5")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("2"),
      });
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("0.5")
      );
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("18"), 1e9);
      expect(
        (await stakeStarETH.totalSupply())
          .mul(ethers.utils.parseEther("0.5"))
          .div(ethers.utils.parseEther("1"))
      ).to.be.closeTo(ethers.utils.parseEther("18"), 1e9);

      await stakeStarPublic.unstake(ethers.utils.parseEther("2"));
      await stakeStarPublic.claim();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("0.5")
      );
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("17"), 1e9);
      expect(
        (await stakeStarETH.totalSupply())
          .mul(ethers.utils.parseEther("0.5"))
          .div(ethers.utils.parseEther("1"))
      ).to.be.closeTo(ethers.utils.parseEther("17"), 1e9);
    });

    it("Rate should be equal last snapshot rate(= 1) if only one snapshot submitted", async function () {
      const {
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleManager,
        stakeStarETH,
        stakeStarRegistry,
        validatorParams1,
        ssvToken,
        stakeStarManager,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("32"),
      });
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

      await stakeStarOracleManager.save(1, ethers.utils.parseEther("32"));
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("2"),
      });
      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("34"), 1e9);
      expect(
        (await stakeStarETH.totalSupply())
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("1"))
      ).to.be.closeTo(ethers.utils.parseEther("34"), 1e9);

      await stakeStarPublic.unstake(ethers.utils.parseEther("2"));
      await stakeStarPublic.claim();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("32"), 1e9);
      expect(
        (await stakeStarETH.totalSupply())
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("1"))
      ).to.be.closeTo(ethers.utils.parseEther("32"), 1e9);
    });

    it("Rate should be approximated based on 2 snapshots (eth amount increasing)", async function () {
      const {
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleManager,
        stakeStarRegistry,
        validatorParams1,
        ssvToken,
        stakeStarManager,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("34"),
      });
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

      await stakeStarOracleManager.save(1, ethers.utils.parseEther("32"));
      await stakeStarPublic.commitSnapshot();

      // we gained 34 eth
      await stakeStarOracleManager.save(11, ethers.utils.parseEther("66"));
      await stakeStarPublic.commitSnapshot();

      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(11)
        )
      ).to.equal(ethers.utils.parseEther("2"));
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(21)
        )
      ).to.equal(ethers.utils.parseEther("3"));
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(31)
        )
      ).to.equal(ethers.utils.parseEther("4"));
    });

    it("Rate should be approximated based on 2 snapshots (eth amount decreasing)", async function () {
      const {
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleManager,
        stakeStarRegistry,
        validatorParams1,
        ssvToken,
        stakeStarManager,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("34"),
      });
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

      await stakeStarOracleManager.save(1, ethers.utils.parseEther("32"));
      await stakeStarPublic.commitSnapshot();

      // we lost 2 eth
      await stakeStarOracleManager.save(11, ethers.utils.parseEther("30"));
      await stakeStarPublic.commitSnapshot();

      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(11)
        )
      ).to.equal(
        ethers.utils
          .parseEther("32")
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("34"))
      );
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(21)
        )
      ).to.equal(
        ethers.utils
          .parseEther("30")
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("34"))
      );
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(31)
        )
      ).to.equal(
        ethers.utils
          .parseEther("28")
          .mul(ethers.utils.parseEther("1"))
          .div(ethers.utils.parseEther("34"))
      );
    });
  });

  describe("OptimizeCapitalEfficiency", function () {
    it("Should optimize capital efficiency on stake if treasury has ssETH when equal amount", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        stakeStarETH,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;
      const userBalance = await provider.getBalance(otherAccount.address);

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });

      await stakeStarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);
      await stakeStarETH.mint(
        stakeStarTreasury.address,
        ethers.utils.parseEther("1")
      );

      expect(await stakeStarETH.balanceOf(stakeStarPublic.address)).to.equal(0);
      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("1")
      );

      await expect(
        stakeStarPublic.stake({
          value: ethers.utils.parseEther("1"),
        })
      )
        .to.emit(stakeStarPublic, "OptimizeCapitalEfficiency")
        .withArgs(ethers.utils.parseEther("1"), ethers.utils.parseEther("1"));

      expect(await stakeStarETH.balanceOf(stakeStarPublic.address)).to.equal(0);
      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        ethers.utils.parseEther("2")
      );
      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("0")
      );

      expect(await provider.getBalance(otherAccount.address)).to.be.closeTo(
        userBalance.sub(ethers.utils.parseEther("2")),
        10000000000000000n
      );
      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });

    it("Should optimize capital efficiency on stake if treasury has ssETH when stake is less", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        stakeStarETH,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });

      await stakeStarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);
      await stakeStarETH.mint(
        stakeStarTreasury.address,
        ethers.utils.parseEther("10")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });

      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        ethers.utils.parseEther("2")
      );
      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("9")
      );

      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });

    it("Should optimize capital efficiency on stake if treasury has ssETH when stake is less", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        stakeStarETH,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });

      await stakeStarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);
      await stakeStarETH.mint(
        stakeStarTreasury.address,
        ethers.utils.parseEther("1")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });

      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        ethers.utils.parseEther("11")
      );
      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("0")
      );

      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        ethers.utils.parseEther("10")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });
  });

  describe("ExtractCommission", function () {
    it("one point", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        stakeStarETH,
        stakeStarOracleManager,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });

      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        ethers.utils.parseEther("10")
      );
      expect(await stakeStarETH.balanceOf(otherAccount.address)).to.equal(
        ethers.utils.parseEther("10")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("0")
      );
      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("0")
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarOracleManager.save(
        139_001,
        ethers.utils.parseEther("0.1")
      );
      await stakeStarPublic.commitSnapshot();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        ethers.utils.parseEther("1.01")
      );

      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("0")
      );
      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        ethers.utils.parseEther("0")
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });

      expect(await stakeStarPublic["rate()"]()).to.be.closeTo(
        ethers.utils.parseEther("1.009"),
        100
      );

      expect(
        await provider.getBalance(stakeStarTreasury.address)
      ).to.be.closeTo(ethers.utils.parseEther("0.01"), 100);
      expect(
        await stakeStarPublic.ssETH_to_ETH(
          await stakeStarETH.balanceOf(otherAccount.address)
        )
      ).to.be.closeTo(ethers.utils.parseEther("20.09"), 100);
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("20.09"), 100);
      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        0
      );
      expect(await stakeStarETH.balanceOf(stakeStarPublic.address)).to.equal(0);
    });

    it("Should extract commission when rate grows [two points, same rate]", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        stakeStarETH,
        stakeStarOracleManager,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });

      await stakeStarOracleManager.save(
        139_001,
        ethers.utils.parseEther("0.2")
      );
      await stakeStarPublic.commitSnapshot();
      await stakeStarOracleManager.save(
        139_002,
        ethers.utils.parseEther("0.2")
      );
      await stakeStarPublic.commitSnapshot();

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });

      expect(await stakeStarPublic["rate()"]()).to.be.closeTo(
        ethers.utils.parseEther("1.018"),
        100
      );

      expect(
        await provider.getBalance(stakeStarTreasury.address)
      ).to.be.closeTo(ethers.utils.parseEther("0.02"), 100);
      expect(
        await stakeStarPublic.ssETH_to_ETH(
          await stakeStarETH.balanceOf(otherAccount.address)
        )
      ).to.be.closeTo(ethers.utils.parseEther("20.18"), 100);
      expect(
        await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
      ).to.be.closeTo(ethers.utils.parseEther("20.18"), 100);
    });

    it("two points #1", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        stakeStarETH,
        stakeStarOracleManager,
        hre,
      } = await loadFixture(deployStakeStarFixture);
      const network = currentNetwork(hre);
      const provider = stakeStarPublic.provider;

      const block0 = await hre.ethers.provider.getBlock("latest");
      const epoch0 = Math.ceil((block0.timestamp - EPOCHS[network]) / 384);

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0,
        ethers.utils.parseEther("0.002")
      );
      await stakeStarPublic.commitSnapshot();

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });

      expect(await stakeStarPublic.rateCorrectionFactor()).to.be.greaterThan(
        ethers.utils.parseEther("0.99")
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.be.lessThan(
        ethers.utils.parseEther("1")
      );

      const total_ssETH = await stakeStarETH.totalSupply();
      const total_ETH = await stakeStarPublic.ssETH_to_ETH(total_ssETH);

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 1,
        ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();

      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleManager.epochTimestamp(epoch0 + 1)
        )
      ).to.equal(
        total_ETH
          .add(ethers.utils.parseEther("0.002"))
          .mul(ethers.utils.parseEther("1"))
          .div(total_ssETH)
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarPublic.extractCommission();
      expect(await stakeStarPublic.rateCorrectionFactor()).to.not.equal(
        ethers.utils.parseEther("1")
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 2,
        ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();
      await stakeStarPublic.extractCommission();

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 3)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 3,
        ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();
      await stakeStarPublic.extractCommission();

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });

      const snapshot0 = await stakeStarPublic.snapshots(0);
      const snapshot1 = await stakeStarPublic.snapshots(1);

      expect(
        snapshot0.total_ETH
          .mul(ethers.utils.parseEther("1"))
          .div(snapshot0.total_ssETH)
      ).to.equal(
        snapshot1.total_ETH
          .mul(ethers.utils.parseEther("1"))
          .div(snapshot1.total_ssETH)
      );

      console.log(
        "treasury eth",
        humanify(await provider.getBalance(stakeStarTreasury.address))
      );
      console.log(
        "user ssETH -> ETH",
        humanify(
          await stakeStarPublic.ssETH_to_ETH(
            await stakeStarETH.balanceOf(otherAccount.address)
          )
        )
      );
      console.log(
        "total ssETH -> ETH",
        humanify(
          await stakeStarPublic.ssETH_to_ETH(await stakeStarETH.totalSupply())
        )
      );

      const total_ETH2 = await stakeStarPublic.ssETH_to_ETH(
        await stakeStarETH.totalSupply()
      );
      const treasuryRewards = await provider.getBalance(
        stakeStarTreasury.address
      );

      expect(total_ETH2.add(treasuryRewards)).to.be.closeTo(
        ethers.utils.parseEther("22.004"),
        100
      );
      expect(
        treasuryRewards.mul(100).div(ethers.utils.parseEther("0.004"))
      ).to.equal(10);
    });

    it("two points #2", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        stakeStarETH,
        stakeStarOracleManager,
        hre,
      } = await loadFixture(deployStakeStarFixture);
      const network = currentNetwork(hre);
      const provider = stakeStarPublic.provider;

      let totalSupply_ssETH,
        totalSupply_ETH,
        poolBalance,
        treasuryBalance,
        rate,
        rewardsGiven,
        totalStaked;

      const block0 = await hre.ethers.provider.getBlock("latest");
      const epoch0 = Math.ceil((block0.timestamp - EPOCHS[network]) / 384);

      console.log("before any operations");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });
      totalStaked = ethers.utils.parseEther("10");

      console.log("stake 10 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0,
        ethers.utils.parseEther("0.002")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = ethers.utils.parseEther("0.002");

      console.log("distribute 0.002 eth rewards");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("0.002"),
      });
      totalStaked = totalStaked.add(ethers.utils.parseEther("0.002"));

      console.log("stake 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      expect(treasuryBalance).to.be.closeTo(rewardsGiven.mul(10).div(100), 1);

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 1,
        rewardsGiven.add(ethers.utils.parseEther("0.004"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(ethers.utils.parseEther("0.004"));

      console.log("distribute additional 0.004 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("0.004"),
      });
      totalStaked = totalStaked.add(ethers.utils.parseEther("0.004"));

      console.log("stake 0.004 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 2,
        rewardsGiven.add(ethers.utils.parseEther("0.006"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(ethers.utils.parseEther("0.006"));

      console.log("distribute additional 0.006 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("0.006"),
      });
      totalStaked = totalStaked.add(ethers.utils.parseEther("0.006"));

      console.log("stake 0.006 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        0
      );

      const expectedRewards = rewardsGiven.mul(10).div(100);
      const diffR = expectedRewards.sub(treasuryBalance).abs();
      console.log(diffR.mul(100_000).div(expectedRewards));
      expect(diffR.mul(100).div(expectedRewards)).to.be.lessThan(1); // less than 1% difference

      const expectedTotalSupply_ETH = totalStaked
        .add(rewardsGiven)
        .sub(treasuryBalance);
      const diffT = expectedTotalSupply_ETH.sub(totalSupply_ETH).abs();
      console.log(diffT.mul(100_000).div(expectedTotalSupply_ETH));
      expect(diffT.mul(100_000).div(expectedTotalSupply_ETH)).to.be.lessThan(1);
    });

    it("two points #3", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        stakeStarETH,
        stakeStarOracleManager,
        hre,
      } = await loadFixture(deployStakeStarFixture);
      const network = currentNetwork(hre);
      const provider = stakeStarPublic.provider;

      let totalSupply_ssETH,
        totalSupply_ETH,
        poolBalance,
        treasuryBalance,
        rate,
        rewardsGiven,
        totalStaked;

      const block0 = await hre.ethers.provider.getBlock("latest");
      const epoch0 = Math.ceil((block0.timestamp - EPOCHS[network]) / 384);

      console.log("before any operations");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });
      totalStaked = ethers.utils.parseEther("10");

      console.log("stake 10 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0,
        ethers.utils.parseEther("0.005")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = ethers.utils.parseEther("0.005");

      console.log("distribute 0.005 eth rewards");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("0.005"),
      });
      totalStaked = totalStaked.add(ethers.utils.parseEther("0.005"));

      console.log("stake 0.005 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      expect(treasuryBalance).to.be.closeTo(rewardsGiven.mul(10).div(100), 1);

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 1,
        rewardsGiven.add(ethers.utils.parseEther("0.002"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(ethers.utils.parseEther("0.002"));

      console.log("distribute additional 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("0.002"),
      });
      totalStaked = totalStaked.add(ethers.utils.parseEther("0.002"));

      console.log("stake 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(epoch0 + 2, 0);
      await stakeStarPublic.commitSnapshot();

      console.log("set all rewards to zero");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("0.006"),
      });
      totalStaked = totalStaked.add(ethers.utils.parseEther("0.006"));

      console.log("stake 0.006 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      expect(await stakeStarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        0
      );

      const expectedRewards = rewardsGiven.mul(10).div(100);
      const diffR = expectedRewards.sub(treasuryBalance).abs();
      // console.log(diffR.mul(100_000).div(expectedRewards));
      expect(diffR.mul(100).div(expectedRewards)).to.be.lessThan(1); // less than 1% difference

      const expectedTotalSupply_ETH = totalStaked
        .add(rewardsGiven)
        .sub(treasuryBalance);
      const diffT = expectedTotalSupply_ETH.sub(totalSupply_ETH).abs();
      // console.log(diffT.mul(100_000).div(expectedTotalSupply_ETH));
      expect(diffT.mul(100).div(expectedTotalSupply_ETH)).to.be.lessThan(1);

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 3)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 3,
        ethers.utils.parseEther("0.002")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(ethers.utils.parseEther("0.002"));

      console.log("distribute 0.002 eth rewards again");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("0.002"),
      });
      totalStaked = totalStaked.add(ethers.utils.parseEther("0.002"));

      console.log("stake 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      const expectedRewards2 = rewardsGiven.mul(10).div(100);
      const diffR2 = expectedRewards2.sub(treasuryBalance).abs();
      // console.log(diffR.mul(100_000).div(expectedRewards));
      expect(diffR2.mul(100).div(expectedRewards2)).to.be.lessThan(1); // less than 1% difference

      const expectedTotalSupply_ETH2 = totalStaked
        .add(rewardsGiven)
        .sub(treasuryBalance);
      const diffT2 = expectedTotalSupply_ETH2.sub(totalSupply_ETH).abs();
      // console.log(diffT.mul(100_000).div(expectedTotalSupply_ETH));
      expect(diffT2.mul(100).div(expectedTotalSupply_ETH2)).to.be.lessThan(1);
    });

    it("two points #4", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        stakeStarETH,
        stakeStarOracleManager,
        hre,
      } = await loadFixture(deployStakeStarFixture);
      const network = currentNetwork(hre);
      const provider = stakeStarPublic.provider;

      let totalSupply_ssETH,
        totalSupply_ETH,
        poolBalance,
        treasuryBalance,
        rate,
        rewardsGiven,
        totalStaked;

      const block0 = await hre.ethers.provider.getBlock("latest");
      const epoch0 = Math.ceil((block0.timestamp - EPOCHS[network]) / 384);

      console.log("before any operations");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("10"),
      });
      totalStaked = ethers.utils.parseEther("10");

      console.log("stake 10 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0,
        ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = ethers.utils.parseEther("0.004");

      console.log("distribute 0.004 eth rewards");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleManager.save(
        epoch0 + 1,
        rewardsGiven.add(ethers.utils.parseEther("0.008"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(ethers.utils.parseEther("0.008"));

      console.log("distribute additional 0.008 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      console.log();
      console.log(
        "rate on epoch0 + 2 before stakes",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 2)
          )
        ),
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 2)).toNumber()
      );
      console.log(
        "rate on epoch0 + 3 before stakes",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 3)
          )
        ),
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 3)).toNumber()
      );
      console.log(
        "rate on epoch0 + 4 before stakes",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 4)
          )
        ),
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 4)).toNumber()
      );
      console.log();

      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      console.log("stake 1 eth on epoch0 + 2");
      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      totalStaked = totalStaked.add(ethers.utils.parseEther("1"));

      console.log();
      console.log(
        "rate on epoch0 + 2 after first stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 2)
          )
        )
      );
      console.log(
        "rate on epoch0 + 3 after first stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 3)
          )
        )
      );
      console.log(
        "rate on epoch0 + 4 after first stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 4)
          )
        )
      );
      console.log();

      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      console.log("stake 1 eth on epoch0 + 3");
      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleManager.epochTimestamp(epoch0 + 3)).toNumber(),
      ]);
      await stakeStarPublic.stake({
        value: ethers.utils.parseEther("1"),
      });
      await hre.network.provider.request({ method: "evm_mine", params: [] });
      totalStaked = totalStaked.add(ethers.utils.parseEther("1"));

      console.log();
      console.log(
        "rate on epoch0 + 2 after second stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 2)
          )
        )
      );
      console.log(
        "rate on epoch0 + 3 after second stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 3)
          )
        )
      );
      console.log(
        "rate on epoch0 + 4 after second stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleManager.epochTimestamp(epoch0 + 4)
          )
        )
      );
      console.log();

      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await stakeStarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.ssETH_to_ETH(totalSupply_ssETH);
      rate = await stakeStarPublic["rate()"]();
      console.log(
        "ssETH",
        humanify(totalSupply_ssETH),
        "ETH",
        humanify(totalSupply_ETH),
        "pool",
        humanify(poolBalance),
        "treasury",
        humanify(treasuryBalance, 18, 9),
        "rate",
        humanify(rate)
      );

      // for epoch0 + 2
      rewardsGiven = rewardsGiven
        .add(ethers.utils.parseEther("0.008"))
        .add(ethers.utils.parseEther("0.008"));
      const expectedRewards = rewardsGiven.mul(10).div(100);
      const diffR = expectedRewards.sub(treasuryBalance).abs();
      expect(diffR.mul(100).div(expectedRewards)).to.be.lessThan(3); // less than 3% difference

      const expectedTotalSupply_ETH = totalStaked
        .add(rewardsGiven)
        .sub(treasuryBalance);
      const diffT = expectedTotalSupply_ETH.sub(totalSupply_ETH).abs();
      expect(diffT.mul(100_000).div(expectedTotalSupply_ETH)).to.be.lessThan(
        10
      ); // less than 0.01% difference
    });
  });
});
