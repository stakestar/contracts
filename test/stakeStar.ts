import { expect } from "chai";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";

import {
  ConstantsLib,
  EPOCHS,
  GENESIS_FORK_VERSIONS,
  OPERATOR_PUBLIC_KEYS,
  RANDOM_PRIVATE_KEY_2,
  ZERO,
  ZERO_ADDRESS,
} from "../scripts/constants";
import { deployStakeStarFixture } from "./test-helpers/fixture";
import { BigNumber } from "ethers";
import { ValidatorStatus } from "../scripts/types";
import { currentNetwork, humanify, retrieveCluster } from "../scripts/helpers";
import { BlockTag } from "@ethersproject/providers";
import {
  createValidator,
  generateValidatorParams,
} from "./test-helpers/wrappers";

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

    it("Should set the right owner for sstarETH/starETH", async function () {
      const { stakeStarPublic, sstarETH, starETH } = await loadFixture(
        deployStakeStarFixture
      );
      expect(
        await sstarETH.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await starETH.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(true);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow to call methods without corresponding roles", async function () {
      const {
        stakeStarPublic,
        validatorParams1,
        otherAccount,
        hre,
        ssvNetwork,
        operatorIDs,
      } = await loadFixture(deployStakeStarFixture);

      const defaultAdminRole = ConstantsLib.DEFAULT_ADMIN_ROLE;
      const managerRole = ConstantsLib.MANAGER_ROLE;
      const cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarPublic.address,
        operatorIDs
      );

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
      await expect(
        stakeStarPublic.setValidatorWithdrawalThreshold(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.reactivate(validatorParams1.operatorIds, 0, cluster)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${defaultAdminRole}`
      );
      await expect(
        stakeStarPublic.createValidator(validatorParams1, 0, cluster)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${managerRole}`
      );
      await expect(
        stakeStarPublic.destroyValidator(
          validatorParams1.publicKey,
          validatorParams1.operatorIds,
          cluster
        )
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
          stakeStarOracleStrict,
          sstarETH,
          starETH,
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
            stakeStarOracleStrict.address,
            sstarETH.address,
            starETH.address,
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
            stakeStarOracleStrict.address,
            sstarETH.address,
            starETH.address,
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
          stakeStarOracleStrict.address
        );
        expect(await stakeStarOwner.sstarETH()).to.eql(sstarETH.address);
        expect(await stakeStarOwner.starETH()).to.eql(starETH.address);
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

      it("Should set fee recipient in SSV Network", async function () {
        const {
          stakeStarOwner,
          addresses,
          stakeStarOracleStrict,
          sstarETH,
          starETH,
          stakeStarRegistry,
          stakeStarTreasury,
          withdrawalAddress,
          feeRecipient,
          mevRecipient,
          ssvNetwork,
        } = await loadFixture(deployStakeStarFixture);

        await expect(
          stakeStarOwner.setAddresses(
            addresses.depositContract,
            addresses.ssvNetwork,
            addresses.ssvToken,
            stakeStarOracleStrict.address,
            sstarETH.address,
            starETH.address,
            stakeStarRegistry.address,
            stakeStarTreasury.address,
            withdrawalAddress.address,
            feeRecipient.address,
            mevRecipient.address
          )
        )
          .to.emit(ssvNetwork, "FeeRecipientAddressUpdated")
          .withArgs(stakeStarOwner.address, feeRecipient.address);
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
        expect(await stakeStarOwner.localPoolWithdrawalLimit()).to.equal(0);
        expect(await stakeStarOwner.localPoolWithdrawalPeriodLimit()).to.equal(
          0
        );

        await expect(stakeStarOwner.setLocalPoolParameters(1, 2, 3))
          .to.emit(stakeStarOwner, "SetLocalPoolParameters")
          .withArgs(1, 2, 3);
        expect(await stakeStarOwner.localPoolMaxSize()).to.equal(1);
        expect(await stakeStarOwner.localPoolWithdrawalLimit()).to.equal(2);
        expect(await stakeStarOwner.localPoolWithdrawalPeriodLimit()).to.equal(
          3
        );

        await stakeStarOwner.setLocalPoolParameters(100, 2, 3);
        expect(await stakeStarOwner.localPoolSize()).to.equal(0);
        await stakeStarOwner.deposit({ value: 100 });
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

    describe("setValidatorWithdrawalThreshold", function () {
      it("Should setValidatorWithdrawalThreshold", async function () {
        const { hre, stakeStarOwner } = await loadFixture(
          deployStakeStarFixture
        );

        expect(await stakeStarOwner.validatorWithdrawalThreshold()).to.equal(
          hre.ethers.utils.parseEther("16")
        );
        await expect(
          stakeStarOwner.setValidatorWithdrawalThreshold(
            hre.ethers.utils.parseEther("16.1")
          )
        )
          .to.emit(stakeStarOwner, "SetValidatorWithdrawalThreshold")
          .withArgs(hre.ethers.utils.parseEther("16.1"));
        expect(await stakeStarOwner.validatorWithdrawalThreshold()).to.eql(
          hre.ethers.utils.parseEther("16.1")
        );
      });
    });
  });

  describe("Deposit", function () {
    it("Should send ETH to the contract", async function () {
      const { stakeStarPublic, starETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarPublic.deposit()).to.be.revertedWith(
        "msg.value = 0"
      );

      const depositAmountETH = BigNumber.from(1);
      const depositAmountStarETH = depositAmountETH;

      await expect(
        stakeStarPublic.deposit({ value: depositAmountETH })
      ).to.changeEtherBalances(
        [otherAccount, stakeStarPublic],
        [depositAmountETH.mul(-1), depositAmountETH]
      );

      await expect(
        stakeStarPublic.deposit({ value: depositAmountETH })
      ).to.changeTokenBalance(starETH, otherAccount, depositAmountStarETH);

      await expect(stakeStarPublic.deposit({ value: depositAmountETH }))
        .to.emit(stakeStarPublic, "Deposit")
        .withArgs(otherAccount.address, depositAmountETH);
    });
  });

  describe("Withdraw", function () {
    it("Should create pendingWithdrawal", async function () {
      const { hre, stakeStarPublic, otherAccount, starETH } = await loadFixture(
        deployStakeStarFixture
      );

      const depositAmountEth = hre.ethers.utils.parseEther("2");
      await stakeStarPublic.deposit({ value: depositAmountEth });
      const starETHAmount = await starETH.balanceOf(otherAccount.address);

      expect(await starETH.totalSupply()).to.equal(starETHAmount);

      const withdrawalAmountStarETH = starETHAmount.div(2);
      const withdrawalAmountETH = withdrawalAmountStarETH;
      const shouldBeBurntStarETH = withdrawalAmountStarETH;

      await expect(
        stakeStarPublic.withdraw(withdrawalAmountStarETH)
      ).to.changeTokenBalance(
        starETH,
        otherAccount,
        shouldBeBurntStarETH.mul(-1)
      );

      expect(await starETH.totalSupply()).to.equal(
        starETHAmount.sub(shouldBeBurntStarETH)
      );
      expect(await stakeStarPublic.pendingWithdrawalSum()).to.equal(
        withdrawalAmountETH
      );
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(withdrawalAmountETH);

      expect(await stakeStarPublic.head()).to.equal(otherAccount.address);
      expect(await stakeStarPublic.tail()).to.equal(otherAccount.address);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        1
      );
      expect((await stakeStarPublic.queue(otherAccount.address)).next).to.equal(
        ZERO_ADDRESS
      );

      await stakeStarPublic.claim();

      expect(await stakeStarPublic.head()).to.equal(ZERO_ADDRESS);
      expect(await stakeStarPublic.tail()).to.equal(ZERO_ADDRESS);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );
      expect((await stakeStarPublic.queue(otherAccount.address)).next).to.equal(
        ZERO_ADDRESS
      );

      await expect(stakeStarPublic.withdraw(withdrawalAmountStarETH))
        .to.emit(stakeStarPublic, "Withdraw")
        .withArgs(otherAccount.address, withdrawalAmountStarETH);
    });

    it("unstake queue", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarManager,
        stakeStarOwner,
        otherAccount,
        manager,
        owner,
        validatorParams1,
        stakeStarRegistry,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("16"),
      });
      await stakeStarManager.deposit({
        value: hre.ethers.utils.parseEther("8"),
      });
      await stakeStarOwner.deposit({ value: hre.ethers.utils.parseEther("8") });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      expect(await stakeStarPublic.head()).to.equal(ZERO_ADDRESS);
      expect(await stakeStarPublic.tail()).to.equal(ZERO_ADDRESS);
      expect(
        (await stakeStarPublic.queue(owner.address)).pendingAmount
      ).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(manager.address)).pendingAmount
      ).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);

      await stakeStarOwner.withdraw(hre.ethers.utils.parseEther("8"));

      expect(await stakeStarPublic.head()).to.equal(owner.address);
      expect(await stakeStarPublic.tail()).to.equal(owner.address);
      expect(
        (await stakeStarPublic.queue(owner.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("8"));
      expect(
        (await stakeStarPublic.queue(manager.address)).pendingAmount
      ).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);

      await stakeStarManager.withdraw(hre.ethers.utils.parseEther("8"));

      expect(await stakeStarPublic.head()).to.equal(owner.address);
      expect(await stakeStarPublic.tail()).to.equal(manager.address);
      expect(
        (await stakeStarPublic.queue(owner.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("8"));
      expect(
        (await stakeStarPublic.queue(manager.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("8"));
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);

      await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("16"));

      expect(await stakeStarPublic.head()).to.equal(owner.address);
      expect(await stakeStarPublic.tail()).to.equal(otherAccount.address);
      expect(
        (await stakeStarPublic.queue(owner.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("8"));
      expect(
        (await stakeStarPublic.queue(manager.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("8"));
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("16"));

      expect((await stakeStarPublic.queue(owner.address)).next).to.equal(
        manager.address
      );
      expect((await stakeStarPublic.queue(manager.address)).next).to.equal(
        otherAccount.address
      );
      expect((await stakeStarPublic.queue(otherAccount.address)).next).to.equal(
        ZERO_ADDRESS
      );

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: hre.ethers.utils.parseEther("8"),
      });

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(1);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: hre.ethers.utils.parseEther("8"),
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

      expect(await stakeStarPublic.head()).to.equal(owner.address);
      expect(await stakeStarPublic.tail()).to.equal(otherAccount.address);

      expect((await stakeStarPublic.queue(owner.address)).next).to.equal(
        otherAccount.address
      );
      expect((await stakeStarPublic.queue(manager.address)).next).to.equal(
        ZERO_ADDRESS
      );
      expect((await stakeStarPublic.queue(otherAccount.address)).next).to.equal(
        ZERO_ADDRESS
      );

      expect(
        (await stakeStarPublic.queue(owner.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("8"));
      expect(
        (await stakeStarPublic.queue(manager.address)).pendingAmount
      ).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("16"));

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: hre.ethers.utils.parseEther("16"),
      });

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(1);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0); // manager already claimed
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        2
      );

      await stakeStarPublic.claim();

      expect(await stakeStarPublic.head()).to.equal(owner.address);
      expect(await stakeStarPublic.tail()).to.equal(owner.address);

      expect((await stakeStarPublic.queue(owner.address)).next).to.equal(
        ZERO_ADDRESS
      );
      expect((await stakeStarPublic.queue(manager.address)).next).to.equal(
        ZERO_ADDRESS
      );
      expect((await stakeStarPublic.queue(otherAccount.address)).next).to.equal(
        ZERO_ADDRESS
      );

      expect(
        (await stakeStarPublic.queue(owner.address)).pendingAmount
      ).to.equal(hre.ethers.utils.parseEther("8"));
      expect(
        (await stakeStarPublic.queue(manager.address)).pendingAmount
      ).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);

      await stakeStarOwner.claim();

      expect(await stakeStarPublic.queueIndex(owner.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(manager.address)).to.equal(0);
      expect(await stakeStarPublic.queueIndex(otherAccount.address)).to.equal(
        0
      );

      expect(
        (await stakeStarPublic.queue(owner.address)).pendingAmount
      ).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(manager.address)).pendingAmount
      ).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);

      expect(await stakeStarPublic.head()).to.equal(ZERO_ADDRESS);
      expect(await stakeStarPublic.tail()).to.equal(ZERO_ADDRESS);

      expect(await stakeStarPublic.pendingWithdrawalSum()).to.equal(0);
    });
  });

  describe("Claim", function () {
    it("Should finish pendingWithdrawal and send Ether", async function () {
      const {
        hre,
        stakeStarManager,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1,
        owner,
        otherAccount,
      } = await loadFixture(deployStakeStarFixture);

      const depositAmount = hre.ethers.utils.parseEther("32");
      const withdrawalAmount = hre.ethers.utils.parseEther("16");

      await expect(stakeStarPublic.claim()).to.be.revertedWith(
        "no pending withdrawal"
      );

      await stakeStarPublic.deposit({ value: depositAmount });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await stakeStarPublic.withdraw(withdrawalAmount);

      await expect(stakeStarPublic.claim()).to.be.revertedWith(
        "lack of eth / queue length"
      );

      await owner.sendTransaction({
        to: stakeStarManager.address,
        value: depositAmount,
      });

      await expect(stakeStarPublic.claim()).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [withdrawalAmount.mul(-1), withdrawalAmount]
      );

      expect(await stakeStarPublic.pendingWithdrawalSum()).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);

      await stakeStarPublic.withdraw(withdrawalAmount);
      await expect(stakeStarPublic.claim())
        .to.emit(stakeStarPublic, "Claim")
        .withArgs(otherAccount.address, withdrawalAmount);
    });
  });

  describe("LocalPoolWithdraw", function () {
    it("Should withdraw from local pool in a single tx", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        otherAccount,
        owner,
        sstarETH,
        starETH,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setLocalPoolParameters(
        hre.ethers.utils.parseEther("2"),
        hre.ethers.utils.parseEther("1"),
        10
      );

      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("5"),
      });

      await starETH
        .connect(otherAccount)
        .transfer(owner.address, hre.ethers.utils.parseEther("1"));

      await expect(
        stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("2"))
      ).to.be.revertedWith("localPoolWithdrawalLimit");

      await expect(
        stakeStarOwner.localPoolWithdraw(hre.ethers.utils.parseEther("1"))
      ).to.be.revertedWith("localPoolWithdrawalPeriodLimit after transfer");

      await mine(100, { interval: 0 });

      await expect(
        stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("1"))
      ).to.changeEtherBalances(
        [stakeStarPublic.address, otherAccount.address],
        [
          hre.ethers.utils.parseEther("1").mul(-1),
          hre.ethers.utils.parseEther("1"),
        ]
      );

      expect(await stakeStarPublic.localPoolSize()).to.eq(
        hre.ethers.utils.parseEther("1")
      );
      await expect(
        stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("1"))
      ).to.be.revertedWith("localPoolWithdrawalPeriodLimit");

      await stakeStarOwner.setLocalPoolParameters(
        hre.ethers.utils.parseEther("2"),
        hre.ethers.utils.parseEther("1"),
        0
      );
      await stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("1"));
      expect(await stakeStarPublic.localPoolSize()).to.eq(ZERO);

      await expect(
        stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("1"))
      ).to.be.revertedWith("localPoolSize");

      await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("2"));
      await stakeStarPublic.claim();

      expect(await sstarETH.balanceOf(otherAccount.address)).to.eq(ZERO);

      expect(await stakeStarPublic.pendingWithdrawalSum()).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);
    });

    it("LocalPoolWithdraw when there is pending withdrawal", async function () {
      const { hre, stakeStarPublic, stakeStarOwner, otherAccount, sstarETH } =
        await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setLocalPoolParameters(
        hre.ethers.utils.parseEther("2"),
        hre.ethers.utils.parseEther("1"),
        0
      );

      await otherAccount.sendTransaction({
        to: stakeStarPublic.address,
        value: hre.ethers.utils.parseEther("10"),
      });

      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("4"),
      });
      await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("3"));
      await stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("1"));
      await expect(
        stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("1"))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("1"),
      });
      await expect(
        stakeStarPublic.withdraw(hre.ethers.utils.parseEther("1"))
      ).to.be.revertedWith("one withdrawal at a time only");
      await stakeStarPublic.localPoolWithdraw(hre.ethers.utils.parseEther("1"));
      await stakeStarPublic.claim();

      expect(await sstarETH.balanceOf(otherAccount.address)).to.eq(ZERO);

      expect(await stakeStarPublic.pendingWithdrawalSum()).to.equal(ZERO);
      expect(
        (await stakeStarPublic.queue(otherAccount.address)).pendingAmount
      ).to.equal(ZERO);
    });
  });

  describe("CreateValidator", function () {
    it("Should create a validator", async function () {
      const {
        hre,
        stakeStarManager,
        ssvToken,
        stakeStarRegistry,
        validatorParams1,
        owner,
        manager,
        ssvNetwork,
        operatorIDs,
      } = await loadFixture(deployStakeStarFixture);
      await ssvToken
        .connect(owner)
        .transfer(
          stakeStarManager.address,
          await ssvToken.balanceOf(owner.address)
        );
      const ssvBalance = await ssvToken.balanceOf(stakeStarManager.address);

      let cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarManager.address,
        operatorIDs
      );

      await expect(
        stakeStarManager.createValidator(validatorParams1, ssvBalance, cluster)
      ).to.be.revertedWith("cannot create validator");

      await manager.sendTransaction({
        to: stakeStarManager.address,
        value: hre.ethers.utils.parseEther("99"),
      });

      await expect(
        stakeStarManager.createValidator(validatorParams1, ssvBalance, cluster)
      ).to.be.revertedWith("operators not allowListed");

      for (const operatorId of validatorParams1.operatorIds) {
        await stakeStarRegistry
          .connect(owner)
          .addOperatorToAllowList(operatorId);
      }

      const validatorParams3 = await generateValidatorParams(
        RANDOM_PRIVATE_KEY_2,
        OPERATOR_PUBLIC_KEYS[currentNetwork(hre)],
        operatorIDs,
        stakeStarManager.address,
        GENESIS_FORK_VERSIONS[currentNetwork(hre)],
        stakeStarManager.address,
        3
      );

      await expect(
        stakeStarManager.createValidator(validatorParams3, ssvBalance, cluster)
      ).to.be.revertedWith("invalid WC");

      await expect(
        stakeStarManager.createValidator(validatorParams1, ssvBalance, cluster)
      ).to.emit(stakeStarManager, "CreateValidator");
    });

    it("Should take into account balance, pendingWithdrawalSum, localPoolSize", async function () {
      const {
        hre,
        stakeStarOwner,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: hre.ethers.utils.parseEther("32"),
      });
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );

      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("32"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("32"));
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await owner.sendTransaction({
        to: stakeStarPublic.address,
        value: hre.ethers.utils.parseEther("31"),
      });
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );

      await stakeStarOwner.setLocalPoolParameters(
        hre.ethers.utils.parseEther("3"),
        hre.ethers.utils.parseEther("1"),
        10
      );
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("3"),
      });
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        false
      );
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("1"),
      });
      expect(await stakeStarPublic.validatorCreationAvailability()).to.equal(
        true
      );
    });
  });

  describe("register/unregister validator", function () {
    it("register/unregister validator", async function () {
      const {
        hre,
        stakeStarManager,
        stakeStarRegistry,
        validatorParams1,
        manager,
        ssvNetwork,
        operatorIDs,
      } = await loadFixture(deployStakeStarFixture);
      await manager.sendTransaction({
        to: stakeStarManager.address,
        value: hre.ethers.utils.parseEther("99"),
      });

      await createValidator(
        hre,
        stakeStarManager,
        stakeStarRegistry,
        validatorParams1
      );

      let cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarManager.address,
        operatorIDs
      );

      await expect(
        stakeStarManager.unregisterValidator(
          validatorParams1.publicKey,
          validatorParams1.operatorIds,
          cluster
        )
      ).to.emit(stakeStarManager, "UnregisterValidator");

      cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarManager.address,
        operatorIDs
      );
      await expect(
        stakeStarManager.registerValidator(validatorParams1, 0, cluster)
      ).to.emit(stakeStarManager, "RegisterValidator");
    });
  });

  describe("DestroyValidator", function () {
    it("destroyValidator", async function () {
      const {
        stakeStarPublic,
        stakeStarManager,
        stakeStarRegistry,
        stakeStarRegistryManager,
        validatorParams1,
        hre,
        ssvNetwork,
        operatorIDs,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("32"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("32"));

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

      const cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarPublic.address,
        operatorIDs
      );

      await expect(
        stakeStarManager.destroyValidator(
          validatorToDestroy,
          validatorParams1.operatorIds,
          cluster
        )
      )
        .to.emit(stakeStarManager, "DestroyValidator")
        .withArgs(validatorToDestroy);

      expect(
        await stakeStarRegistry.validatorStatuses(validatorToDestroy)
      ).to.eql(ValidatorStatus.EXITED);
    });

    describe("validatorDestructionAvailability", function () {
      it("16 eth limit", async function () {
        const {
          stakeStarPublic,
          stakeStarManager,
          stakeStarRegistry,
          stakeStarRegistryManager,
          validatorParams1,
          validatorParams2,
          hre,
          owner,
        } = await loadFixture(deployStakeStarFixture);
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;

        await stakeStarPublic.deposit({
          value: hre.ethers.utils.parseEther("64"),
        });

        await createValidator(
          hre,
          stakeStarPublic,
          stakeStarRegistry,
          validatorParams1
        );
        await createValidator(
          hre,
          stakeStarPublic,
          stakeStarRegistry,
          validatorParams2
        );

        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;

        await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("32"));
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

        await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("14"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;
        await owner.sendTransaction({
          to: stakeStarManager.address,
          value: hre.ethers.utils.parseEther("14"),
        });
        await stakeStarPublic.claim();

        await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("16"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .true;
      });

      it("takes pendingWithdrawalSum, localPoolSize, WA, feeRecipient, mevRecipient, free eth", async function () {
        const {
          stakeStarPublic,
          stakeStarManager,
          stakeStarOwner,
          stakeStarRegistry,
          stakeStarRegistryManager,
          validatorParams1,
          validatorParams2,
          hre,
          owner,
          withdrawalAddress,
          feeRecipient,
          mevRecipient,
        } = await loadFixture(deployStakeStarFixture);
        await stakeStarPublic.deposit({
          value: hre.ethers.utils.parseEther("64"),
        });

        await createValidator(
          hre,
          stakeStarPublic,
          stakeStarRegistry,
          validatorParams1
        );
        await createValidator(
          hre,
          stakeStarPublic,
          stakeStarRegistry,
          validatorParams2
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
        await stakeStarOwner.deposit({
          value: hre.ethers.utils.parseEther("1"),
        });
        await stakeStarManager.deposit({
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
        await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("16"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;
        await stakeStarOwner.withdraw(hre.ethers.utils.parseEther("0.110"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .false;
        await stakeStarManager.withdraw(hre.ethers.utils.parseEther("0.001"));
        expect(await stakeStarManager.validatorDestructionAvailability()).to.be
          .true;
      });

      it("takes pendingWithdrawalSum, exitingETH", async function () {
        const {
          stakeStarPublic,
          stakeStarManager,
          stakeStarRegistry,
          stakeStarRegistryManager,
          validatorParams1,
          validatorParams2,
          hre,
        } = await loadFixture(deployStakeStarFixture);

        await stakeStarPublic.deposit({
          value: hre.ethers.utils.parseEther("64"),
        });

        await createValidator(
          hre,
          stakeStarPublic,
          stakeStarRegistry,
          validatorParams1
        );
        await createValidator(
          hre,
          stakeStarPublic,
          stakeStarRegistry,
          validatorParams2
        );

        await stakeStarRegistryManager.confirmActivatingValidator(
          validatorParams1.publicKey
        );
        await stakeStarRegistryManager.confirmActivatingValidator(
          validatorParams2.publicKey
        );

        await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("16"));
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
        validatorParams1,
        hre,
        ssvNetwork,
        operatorIDs,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("32"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await expect(stakeStarPublic.validatorToDestroy()).to.be.revertedWith(
        "destroy not available"
      );

      await stakeStarPublic.withdraw(hre.ethers.utils.parseEther("32"));

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

      const cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarPublic.address,
        operatorIDs
      );

      await stakeStarManager.destroyValidator(
        validatorToDestroy,
        validatorParams1.operatorIds,
        cluster
      );

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
      const {
        hre,
        stakeStarPublic,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarOracleStrict1.save(
        1,
        hre.ethers.utils.parseEther("0.001")
      );
      await stakeStarOracleStrict2.save(
        1,
        hre.ethers.utils.parseEther("0.001")
      );
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "totals must be > 0"
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });
      await expect(stakeStarPublic.commitSnapshot())
        .to.emit(stakeStarPublic, "CommitSnapshot")
        .withArgs(
          hre.ethers.utils.parseEther("1.001"),
          hre.ethers.utils.parseEther("1"),
          await stakeStarOracleStrict1.epochToTimestamp(1),
          hre.ethers.utils.parseEther("1.001")
        );

      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "timestamps too close"
      );

      await stakeStarOracleStrict1.save(
        2,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarOracleStrict2.save(
        2,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarPublic.commitSnapshot();

      await stakeStarOracleStrict1.save(
        3,
        hre.ethers.utils.parseEther("0.003")
      );
      await stakeStarOracleStrict2.save(
        3,
        hre.ethers.utils.parseEther("0.003")
      );
      await stakeStarPublic.commitSnapshot();

      const snapshot0 = await stakeStarPublic.snapshots(0);
      const snapshot1 = await stakeStarPublic.snapshots(1);

      expect(snapshot0.total_ETH).to.equal(
        hre.ethers.utils.parseEther("1.002")
      );
      expect(snapshot1.total_ETH).to.equal(
        hre.ethers.utils.parseEther("1.003")
      );
      expect(snapshot0.total_stakedStar).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(snapshot1.total_stakedStar).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(snapshot0.timestamp).to.equal(
        await stakeStarOracleStrict1.epochToTimestamp(2)
      );
      expect(snapshot1.timestamp).to.equal(
        await stakeStarOracleStrict2.epochToTimestamp(3)
      );
    });

    it("Should pull fees before calculations", async function () {
      const {
        hre,
        stakeStarPublic,
        otherAccount,
        feeRecipient,
        mevRecipient,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });

      await otherAccount.sendTransaction({
        value: hre.ethers.utils.parseEther("0.001"),
        to: feeRecipient.address,
      });
      await otherAccount.sendTransaction({
        value: hre.ethers.utils.parseEther("0.0001"),
        to: mevRecipient.address,
      });

      await stakeStarOracleStrict1.save(
        1,
        hre.ethers.utils.parseEther("0.00001")
      );
      await stakeStarOracleStrict2.save(
        1,
        hre.ethers.utils.parseEther("0.00001")
      );

      await expect(stakeStarPublic.commitSnapshot())
        .to.emit(stakeStarPublic, "CommitSnapshot")
        .withArgs(
          hre.ethers.utils.parseEther("1.00111"),
          hre.ethers.utils.parseEther("1"),
          await stakeStarOracleStrict1.epochToTimestamp(1),
          hre.ethers.utils.parseEther("1.00111")
        );

      const snapshot1 = await stakeStarPublic.snapshots(1);
      expect(snapshot1.total_ETH).to.equal(
        hre.ethers.utils.parseEther("1.00111")
      );
      expect(snapshot1.total_stakedStar).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(snapshot1.timestamp).to.equal(
        await stakeStarOracleStrict1.epochToTimestamp(1)
      );

      expect(
        await stakeStarPublic.provider.getBalance(stakeStarPublic.address)
      ).to.equal(hre.ethers.utils.parseEther("1.0011"));
    });

    it("Should WA after calculations", async function () {
      const {
        hre,
        stakeStarPublic,
        otherAccount,
        withdrawalAddress,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });

      await otherAccount.sendTransaction({
        value: hre.ethers.utils.parseEther("0.0001"),
        to: withdrawalAddress.address,
      });

      await stakeStarOracleStrict1.save(
        1,
        hre.ethers.utils.parseEther("0.0001")
      );
      await stakeStarOracleStrict2.save(
        1,
        hre.ethers.utils.parseEther("0.0001")
      );

      await expect(stakeStarPublic.commitSnapshot())
        .to.emit(stakeStarPublic, "CommitSnapshot")
        .withArgs(
          hre.ethers.utils.parseEther("1.0001"),
          hre.ethers.utils.parseEther("1"),
          await stakeStarOracleStrict1.epochToTimestamp(1),
          hre.ethers.utils.parseEther("1.0001")
        );

      const snapshot1 = await stakeStarPublic.snapshots(1);
      expect(snapshot1.total_ETH).to.equal(
        hre.ethers.utils.parseEther("1.0001")
      );
      expect(snapshot1.total_stakedStar).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(snapshot1.timestamp).to.equal(
        await stakeStarOracleStrict1.epochToTimestamp(1)
      );

      expect(
        await stakeStarPublic.provider.getBalance(stakeStarPublic.address)
      ).to.equal(hre.ethers.utils.parseEther("1.0001"));
    });

    it("maxRateDeviation", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarRegistry,
        validatorParams1,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;
      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );
      const baseEpochNumber = currentEpochNumber - 1000;

      await stakeStarOwner.setRateParameters(100, true); // 0.1%

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("32"),
      });
      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("32")
      ); // base
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("32")
      ); // base
      await stakeStarPublic.commitSnapshot();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 2,
        hre.ethers.utils.parseEther("32").mul(10011).div(10000)
      ); // 0.11% increase
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 2,
        hre.ethers.utils.parseEther("32").mul(10011).div(10000)
      ); // 0.11% increase
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "rate deviation too big"
      );
      await stakeStarOracleStrict1.save(
        baseEpochNumber + 3,
        hre.ethers.utils.parseEther("32").mul(9989).div(10000)
      ); // 0.11% decrease
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 3,
        hre.ethers.utils.parseEther("32").mul(9989).div(10000)
      ); // 0.11% decrease
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "rate deviation too big"
      );

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 4,
        hre.ethers.utils.parseEther("32").mul(9990).div(10000)
      ); // 0.1% decrease
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 4,
        hre.ethers.utils.parseEther("32").mul(9990).div(10000)
      ); // 0.1% decrease
      await stakeStarPublic.commitSnapshot();
      await stakeStarOracleStrict1.save(
        baseEpochNumber + 5,
        hre.ethers.utils
          .parseEther("32")
          .mul(9990)
          .div(10000)
          .mul(10010)
          .div(10000)
      ); // 0.1% increase
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 5,
        hre.ethers.utils
          .parseEther("32")
          .mul(9990)
          .div(10000)
          .mul(10010)
          .div(10000)
      ); // 0.1% increase
      await stakeStarPublic.commitSnapshot();

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 6,
        hre.ethers.utils.parseEther("100")
      ); // massive increase
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 6,
        hre.ethers.utils.parseEther("100")
      ); // massive increase
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "rate deviation too big"
      );
      await stakeStarOwner.setRateParameters(1000, false); // disable check
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic.rateDeviationCheck()).to.be.true;
    });

    it("maxRateDeviation initial check", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;
      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );
      const baseEpochNumber = currentEpochNumber - 1000;

      await stakeStarOwner.setRateParameters(100, true); // 0.1%

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.002")
      );
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "rate deviation too big"
      );
      await stakeStarOracleStrict1.save(
        baseEpochNumber + 2,
        hre.ethers.utils.parseEther("0.001")
      );
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 2,
        hre.ethers.utils.parseEther("0.001")
      );
      await stakeStarPublic.commitSnapshot();
    });
  });

  describe("Linear approximation by Sasha U. Kind of legacy test", function () {
    it("Should approximate ssETH rate", async function () {
      const {
        hre,
        stakeStarOwner,
        stakeStarPublic,
        otherAccount,
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;

      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );

      const one = hre.ethers.utils.parseEther("1");
      const oneHundred = hre.ethers.utils.parseEther("100");

      await stakeStarOwner.setRateParameters(100_000, true);

      // some stake required because of division by zero
      await stakeStarPublic.depositAndStake({ value: oneHundred });
      // one to one
      const balance1 = await sstarETH.balanceOf(otherAccount.address);
      expect(balance1).to.equal(oneHundred);

      const getTime = async function () {
        return (
          await hre.ethers.provider.getBlock(
            await hre.ethers.provider.getBlockNumber()
          )
        ).timestamp;
      };
      const initialTimestamp = await stakeStarOracleStrict1.epochToTimestamp(
        currentEpochNumber
      );

      // not initialized yet
      expect(await stakeStarPublic["rate()"]()).to.equal(one);

      // distribute 0.01 first time
      await stakeStarOracleStrict1.save(
        currentEpochNumber - 3,
        hre.ethers.utils.parseEther("0.01")
      );
      await stakeStarOracleStrict2.save(
        currentEpochNumber - 3,
        hre.ethers.utils.parseEther("0.01")
      );
      await expect(stakeStarOwner.commitSnapshot())
        .to.emit(stakeStarOwner, "CommitSnapshot")
        .withArgs(
          hre.ethers.utils.parseEther("100.01"),
          hre.ethers.utils.parseEther("100"),
          await stakeStarOracleStrict1.epochToTimestamp(currentEpochNumber - 3),
          hre.ethers.utils
            .parseEther("100.01")
            .mul(hre.ethers.utils.parseEther("1"))
            .div(hre.ethers.utils.parseEther("100"))
        );
      // still not initialized yet (only one point), so return rate from the only one point
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils
          .parseEther("100.01")
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("100"))
      );

      // // distribute another 0.01
      await stakeStarOracleStrict1.save(
        currentEpochNumber - 2,
        hre.ethers.utils.parseEther("0.02")
      );
      await stakeStarOracleStrict2.save(
        currentEpochNumber - 2,
        hre.ethers.utils.parseEther("0.02")
      );
      await stakeStarOwner.commitSnapshot();

      // two points initialized. If timestamp = last point, reward = last reward
      // 0.02 will be distributed by 100 staked ethers
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(currentEpochNumber - 2)
        )
      ).to.equal(
        hre.ethers.utils
          .parseEther("100.02")
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("100"))
      );

      // 2 epochs(384 * 2 seconds) spent with rate 0.01 ether / epoch
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(currentEpochNumber)
        )
      ).to.equal(
        hre.ethers.utils
          .parseEther("100.04")
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("100"))
      );

      const getCurrentRate = async function (
        totalStakedEth: BigNumber,
        tm: number | undefined = undefined,
        totalStakedSS: BigNumber | undefined = undefined
      ) {
        totalStakedSS = totalStakedSS
          ? totalStakedSS
          : await sstarETH.totalSupply();
        tm = tm ? tm : await getTime();

        // current reward = 0.01 / 250 * timedelta + 0.02
        const currentReward = hre.ethers.utils
          .parseEther("0.01")
          .mul(tm - initialTimestamp.toNumber())
          .div(384)
          .add(hre.ethers.utils.parseEther("0.04"));

        // so rate (totalStakedEth + currentReward) / total staked
        const currentRate = totalStakedEth
          .add(currentReward)
          .mul(one)
          .div(totalStakedSS);

        expect(await stakeStarPublic["rate()"]()).to.equal(currentRate);

        return [currentRate, currentReward];
      };

      await hre.network.provider.request({ method: "evm_mine", params: [] });
      let [currentRate] = await getCurrentRate(
        hre.ethers.utils.parseEther("100")
      );
      expect(await stakeStarPublic["rate()"]()).to.equal(currentRate);

      await hre.network.provider.request({ method: "evm_mine", params: [] });
      [currentRate] = await getCurrentRate(hre.ethers.utils.parseEther("100"));
      expect(await stakeStarPublic["rate()"]()).to.equal(currentRate);

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        initialTimestamp.toNumber() + 400,
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });
      await getCurrentRate(hre.ethers.utils.parseEther("100"));

      expect(await sstarETH.balanceOf(otherAccount.address)).to.equal(balance1);

      // Another Stake 100
      const tx = await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("100"),
      });
      const tx_timestamp = (
        await hre.ethers.provider.getBlock(tx.blockNumber as BlockTag)
      ).timestamp;

      let [currentRateB] = await getCurrentRate(
        hre.ethers.utils.parseEther("100"),
        tx_timestamp,
        balance1
      );

      let newStaked = hre.ethers.utils
        .parseEther("100")
        .mul(one)
        .div(currentRateB);
      const balance2 = await sstarETH.balanceOf(otherAccount.address);
      expect(balance2).to.equal(newStaked.add(balance1));

      await stakeStarPublic.unstakeAndWithdraw(newStaked);
      await stakeStarPublic.claim();
    });
  });

  describe("Rate", function () {
    it("Rate shouldn't change before any oracles submissions and be equal 1 ether", async function () {
      const { hre, stakeStarPublic, stakeStarOwner, sstarETH, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1.23"),
      });
      expect(await sstarETH.balanceOf(otherAccount.address)).to.equal(
        hre.ethers.utils.parseEther("1.23")
      );
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarPublic.unstakeAndWithdraw(
        hre.ethers.utils.parseEther("1.23")
      );
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(await sstarETH.totalSupply()).to.equal(0);

      await stakeStarPublic.claim();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarOwner.setLocalPoolParameters(
        hre.ethers.utils.parseEther("1.23"),
        hre.ethers.utils.parseEther("1.23"),
        1
      );
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1.23"),
      });
      await stakeStarPublic.unstakeAndLocalPoolWithdraw(
        hre.ethers.utils.parseEther("1.23")
      );
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(await sstarETH.totalSupply()).to.equal(0);
    });

    it("Rate should be equal last snapshot rate(> 1) if only one snapshot submitted", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
        sstarETH,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarOracleStrict1.save(1, 1);
      await stakeStarOracleStrict2.save(1, 1);
      await expect(stakeStarPublic.commitSnapshot()).to.be.revertedWith(
        "totals must be > 0"
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("2"),
      });
      await stakeStarOracleStrict1.save(2, hre.ethers.utils.parseEther("0.2"));
      await stakeStarOracleStrict2.save(2, hre.ethers.utils.parseEther("0.2"));
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1.1")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("2"),
      });
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1.1")
      );
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("4.2"), 1e9);
      expect(
        (await sstarETH.totalSupply())
          .mul(hre.ethers.utils.parseEther("1.1"))
          .div(hre.ethers.utils.parseEther("1"))
      ).to.be.closeTo(hre.ethers.utils.parseEther("4.2"), 1e9);

      await stakeStarPublic.unstakeAndWithdraw(
        hre.ethers.utils.parseEther("2")
      );
      await stakeStarPublic.claim();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1.1")
      );
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("2"), 1e9);
      expect(
        (await sstarETH.totalSupply())
          .mul(hre.ethers.utils.parseEther("1.1"))
          .div(hre.ethers.utils.parseEther("1"))
      ).to.be.closeTo(hre.ethers.utils.parseEther("2"), 1e9);
    });

    it("Rate should be equal last snapshot rate(< 1) if only one snapshot submitted", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        sstarETH,
        stakeStarRegistry,
        validatorParams1,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("32"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await stakeStarOracleStrict1.save(1, hre.ethers.utils.parseEther("16"));
      await stakeStarOracleStrict2.save(1, hre.ethers.utils.parseEther("16"));
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("0.5")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("2"),
      });
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("0.5")
      );
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("18"), 1e9);
      expect(
        (await sstarETH.totalSupply())
          .mul(hre.ethers.utils.parseEther("0.5"))
          .div(hre.ethers.utils.parseEther("1"))
      ).to.be.closeTo(hre.ethers.utils.parseEther("18"), 1e9);

      await stakeStarPublic.unstakeAndWithdraw(
        hre.ethers.utils.parseEther("2")
      );
      await stakeStarPublic.claim();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("0.5")
      );
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("17"), 1e9);
      expect(
        (await sstarETH.totalSupply())
          .mul(hre.ethers.utils.parseEther("0.5"))
          .div(hre.ethers.utils.parseEther("1"))
      ).to.be.closeTo(hre.ethers.utils.parseEther("17"), 1e9);
    });

    it("Rate should be equal last snapshot rate(= 1) if only one snapshot submitted", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        sstarETH,
        stakeStarRegistry,
        validatorParams1,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("32"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await stakeStarOracleStrict1.save(1, hre.ethers.utils.parseEther("32"));
      await stakeStarOracleStrict2.save(1, hre.ethers.utils.parseEther("32"));
      await stakeStarPublic.commitSnapshot();
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("2"),
      });
      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("34"), 1e9);
      expect(
        (await sstarETH.totalSupply())
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("1"))
      ).to.be.closeTo(hre.ethers.utils.parseEther("34"), 1e9);

      await stakeStarPublic.unstakeAndWithdraw(
        hre.ethers.utils.parseEther("2")
      );
      await stakeStarPublic.claim();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("32"), 1e9);
      expect(
        (await sstarETH.totalSupply())
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("1"))
      ).to.be.closeTo(hre.ethers.utils.parseEther("32"), 1e9);
    });

    it("Rate should be approximated based on 2 snapshots (eth amount increasing)", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarRegistry,
        validatorParams1,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("34"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await stakeStarOracleStrict1.save(1, hre.ethers.utils.parseEther("32"));
      await stakeStarOracleStrict2.save(1, hre.ethers.utils.parseEther("32"));
      await stakeStarPublic.commitSnapshot();

      // we gained 34 eth
      await stakeStarOracleStrict1.save(11, hre.ethers.utils.parseEther("66"));
      await stakeStarOracleStrict2.save(11, hre.ethers.utils.parseEther("66"));
      await stakeStarPublic.commitSnapshot();

      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(11)
        )
      ).to.equal(hre.ethers.utils.parseEther("2"));
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(21)
        )
      ).to.equal(hre.ethers.utils.parseEther("3"));
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(31)
        )
      ).to.equal(hre.ethers.utils.parseEther("4"));
    });

    it("Rate should be approximated based on 2 snapshots (eth amount decreasing)", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarRegistry,
        validatorParams1,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      await stakeStarOwner.setRateParameters(100_000, true);

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("34"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      await stakeStarOracleStrict1.save(1, hre.ethers.utils.parseEther("32"));
      await stakeStarOracleStrict2.save(1, hre.ethers.utils.parseEther("32"));
      await stakeStarPublic.commitSnapshot();

      // we lost 2 eth
      await stakeStarOracleStrict1.save(11, hre.ethers.utils.parseEther("30"));
      await stakeStarOracleStrict2.save(11, hre.ethers.utils.parseEther("30"));
      await stakeStarPublic.commitSnapshot();

      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(11)
        )
      ).to.equal(
        hre.ethers.utils
          .parseEther("32")
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("34"))
      );
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(21)
        )
      ).to.equal(
        hre.ethers.utils
          .parseEther("30")
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("34"))
      );
      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(31)
        )
      ).to.equal(
        hre.ethers.utils
          .parseEther("28")
          .mul(hre.ethers.utils.parseEther("1"))
          .div(hre.ethers.utils.parseEther("34"))
      );
    });
  });

  describe("OptimizeCapitalEfficiency", function () {
    it("Should optimize capital efficiency on stake if treasury has ssETH when equal amount", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        sstarETH,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;
      const userBalance = await provider.getBalance(otherAccount.address);

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });

      await sstarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);
      await sstarETH.mint(
        stakeStarTreasury.address,
        hre.ethers.utils.parseEther("1")
      );

      expect(await sstarETH.balanceOf(stakeStarPublic.address)).to.equal(0);
      expect(await sstarETH.balanceOf(otherAccount.address)).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await expect(
        stakeStarPublic.depositAndStake({
          value: hre.ethers.utils.parseEther("1"),
        })
      )
        .to.emit(stakeStarPublic, "OptimizeCapitalEfficiency")
        .withArgs(
          hre.ethers.utils.parseEther("1"),
          hre.ethers.utils.parseEther("1")
        );

      expect(await sstarETH.balanceOf(stakeStarPublic.address)).to.equal(0);
      expect(await sstarETH.balanceOf(otherAccount.address)).to.equal(
        hre.ethers.utils.parseEther("2")
      );
      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("0")
      );

      expect(await provider.getBalance(otherAccount.address)).to.be.closeTo(
        userBalance.sub(hre.ethers.utils.parseEther("2")),
        10000000000000000n
      );
      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("1")
      );
    });

    it("Should optimize capital efficiency on stake if treasury has ssETH when stake is less", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        sstarETH,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });

      await sstarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);
      await sstarETH.mint(
        stakeStarTreasury.address,
        hre.ethers.utils.parseEther("10")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });

      expect(await sstarETH.balanceOf(otherAccount.address)).to.equal(
        hre.ethers.utils.parseEther("2")
      );
      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("9")
      );

      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        hre.ethers.utils.parseEther("1")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("1")
      );
    });

    it("Should optimize capital efficiency on stake if treasury has ssETH when stake is less", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        sstarETH,
        owner,
      } = await loadFixture(deployStakeStarFixture);
      const provider = stakeStarPublic.provider;

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });

      await sstarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);
      await sstarETH.mint(
        stakeStarTreasury.address,
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });

      expect(await sstarETH.balanceOf(otherAccount.address)).to.equal(
        hre.ethers.utils.parseEther("11")
      );
      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("0")
      );

      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        hre.ethers.utils.parseEther("10")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("1")
      );
    });
  });

  describe("ExtractCommission", function () {
    it("one point", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarTreasury,
        otherAccount,
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;
      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );
      const baseEpochNumber = currentEpochNumber - 1000;

      const provider = stakeStarPublic.provider;

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      await stakeStarOwner.setRateParameters(1000, true);

      expect(await provider.getBalance(stakeStarPublic.address)).to.equal(
        hre.ethers.utils.parseEther("10")
      );
      expect(await sstarETH.balanceOf(otherAccount.address)).to.equal(
        hre.ethers.utils.parseEther("10")
      );
      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("0")
      );
      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("0")
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.1")
      );
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.1")
      );
      await stakeStarPublic.commitSnapshot();

      expect(await stakeStarPublic["rate()"]()).to.equal(
        hre.ethers.utils.parseEther("1.01")
      );

      expect(await provider.getBalance(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("0")
      );
      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.equal(
        hre.ethers.utils.parseEther("0")
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("10"),
      });

      expect(await stakeStarPublic["rate()"]()).to.be.closeTo(
        hre.ethers.utils.parseEther("1.009"),
        100
      );

      expect(
        await provider.getBalance(stakeStarTreasury.address)
      ).to.be.closeTo(hre.ethers.utils.parseEther("0.01"), 100);
      expect(
        await stakeStarPublic.stakedStarToETH(
          await sstarETH.balanceOf(otherAccount.address)
        )
      ).to.be.closeTo(hre.ethers.utils.parseEther("20.09"), 100);
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("20.09"), 100);
      expect(
        await sstarETH.balanceOf(stakeStarTreasury.address)
      ).to.be.lessThanOrEqual(1); // должно быть = 0, но ошибки округления
      expect(await sstarETH.balanceOf(stakeStarPublic.address)).to.equal(0);
    });

    it("Should extract commission when rate grows [two points, same rate]", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarTreasury,
        otherAccount,
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;
      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );
      const baseEpochNumber = currentEpochNumber - 1000;
      const provider = stakeStarPublic.provider;

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      await stakeStarOwner.setRateParameters(2000, true);

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.2")
      );
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.2")
      );
      await stakeStarPublic.commitSnapshot();
      await stakeStarOracleStrict1.save(
        baseEpochNumber + 2,
        hre.ethers.utils.parseEther("0.2")
      );
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 2,
        hre.ethers.utils.parseEther("0.2")
      );
      await stakeStarPublic.commitSnapshot();

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("10"),
      });

      expect(await stakeStarPublic["rate()"]()).to.be.closeTo(
        hre.ethers.utils.parseEther("1.018"),
        100
      );

      expect(
        await provider.getBalance(stakeStarTreasury.address)
      ).to.be.closeTo(hre.ethers.utils.parseEther("0.02"), 100);
      expect(
        await stakeStarPublic.stakedStarToETH(
          await sstarETH.balanceOf(otherAccount.address)
        )
      ).to.be.closeTo(hre.ethers.utils.parseEther("20.18"), 100);
      expect(
        await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
      ).to.be.closeTo(hre.ethers.utils.parseEther("20.18"), 100);
    });

    it("two points #1", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarTreasury,
        otherAccount,
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      const network = currentNetwork(hre);
      const provider = stakeStarPublic.provider;

      const block0 = await hre.ethers.provider.getBlock("latest");
      const epoch0 = Math.ceil((block0.timestamp - EPOCHS[network]) / 384);

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarOracleStrict2.save(
        epoch0,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarPublic.commitSnapshot();

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("10"),
      });

      expect(await stakeStarPublic.rateCorrectionFactor()).to.be.greaterThan(
        hre.ethers.utils.parseEther("0.99")
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.be.lessThan(
        hre.ethers.utils.parseEther("1")
      );

      const total_ssETH = await sstarETH.totalSupply();
      const total_ETH = await stakeStarPublic.stakedStarToETH(total_ssETH);

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 1,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 1,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();

      expect(
        await stakeStarPublic["rate(uint256)"](
          await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 1)
        )
      ).to.equal(
        total_ETH
          .add(hre.ethers.utils.parseEther("0.002"))
          .mul(hre.ethers.utils.parseEther("1"))
          .div(total_ssETH)
      );
      expect(await stakeStarPublic.rateCorrectionFactor()).to.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarPublic.extractCommission();
      expect(await stakeStarPublic.rateCorrectionFactor()).to.not.equal(
        hre.ethers.utils.parseEther("1")
      );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("1"),
      });

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 2,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 2,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();
      await stakeStarPublic.extractCommission();

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 3)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 3,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 3,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();
      await stakeStarPublic.extractCommission();

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("1"),
      });

      const snapshot0 = await stakeStarPublic.snapshots(0);
      const snapshot1 = await stakeStarPublic.snapshots(1);

      expect(
        snapshot0.total_ETH
          .mul(hre.ethers.utils.parseEther("1"))
          .div(snapshot0.total_stakedStar)
      ).to.equal(
        snapshot1.total_ETH
          .mul(hre.ethers.utils.parseEther("1"))
          .div(snapshot1.total_stakedStar)
      );

      console.log(
        "treasury eth",
        humanify(await provider.getBalance(stakeStarTreasury.address))
      );
      console.log(
        "user ssETH -> ETH",
        humanify(
          await stakeStarPublic.stakedStarToETH(
            await sstarETH.balanceOf(otherAccount.address)
          )
        )
      );
      console.log(
        "total ssETH -> ETH",
        humanify(
          await stakeStarPublic.stakedStarToETH(await sstarETH.totalSupply())
        )
      );

      const total_ETH2 = await stakeStarPublic.stakedStarToETH(
        await sstarETH.totalSupply()
      );
      const treasuryRewards = await provider.getBalance(
        stakeStarTreasury.address
      );

      expect(total_ETH2.add(treasuryRewards)).to.be.closeTo(
        hre.ethers.utils.parseEther("22.004"),
        100
      );
      expect(
        treasuryRewards.mul(100).div(hre.ethers.utils.parseEther("0.004"))
      ).to.equal(10);
    });

    it("two points #2", async function () {
      const {
        stakeStarPublic,
        stakeStarTreasury,
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
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
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      totalStaked = hre.ethers.utils.parseEther("10");
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("10"),
      });

      console.log("stake 10 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarOracleStrict2.save(
        epoch0,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = hre.ethers.utils.parseEther("0.002");

      console.log("distribute 0.002 eth rewards");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.002"),
      });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("0.002"));
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("0.002"),
      });

      console.log("stake 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 1,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.004"))
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 1,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.004"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(hre.ethers.utils.parseEther("0.004"));

      console.log("distribute additional 0.004 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.004"),
      });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("0.004"));
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("0.004"),
      });

      console.log("stake 0.004 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 2,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.006"))
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 2,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.006"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(hre.ethers.utils.parseEther("0.006"));

      console.log("distribute additional 0.006 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.006"),
      });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("0.006"));
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("0.006"),
      });

      console.log("stake 0.006 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      expect(
        await sstarETH.balanceOf(stakeStarTreasury.address)
      ).to.be.lessThanOrEqual(1);

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
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
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
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      totalStaked = hre.ethers.utils.parseEther("10");
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("10"),
      });

      console.log("stake 10 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0,
        hre.ethers.utils.parseEther("0.005")
      );
      await stakeStarOracleStrict2.save(
        epoch0,
        hre.ethers.utils.parseEther("0.005")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = hre.ethers.utils.parseEther("0.005");

      console.log("distribute 0.005 eth rewards");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.005"),
      });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("0.005"));
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("0.005"),
      });

      console.log("stake 0.005 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 1,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.002"))
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 1,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.002"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(hre.ethers.utils.parseEther("0.002"));

      console.log("distribute additional 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.002"),
      });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("0.002"));

      console.log("stake 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(epoch0 + 2, 0);
      await stakeStarOracleStrict2.save(epoch0 + 2, 0);
      await stakeStarPublic.commitSnapshot();

      console.log("set all rewards to zero");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.006"),
      });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("0.006"));

      console.log("stake 0.006 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      expect(
        await sstarETH.balanceOf(stakeStarTreasury.address)
      ).to.be.lessThanOrEqual(1);

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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 3)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 3,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 3,
        hre.ethers.utils.parseEther("0.002")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(hre.ethers.utils.parseEther("0.002"));

      console.log("distribute 0.002 eth rewards again");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.002"),
      });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("0.002"));
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("0.002"),
      });

      console.log("stake 0.002 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
      // console.log(diffR2.mul(100_000).div(expectedRewards));
      expect(diffR2.mul(100_000).div(expectedRewards2)).to.be.lessThan(1223); // less than 1.223% difference

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
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
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
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      totalStaked = hre.ethers.utils.parseEther("10");
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("10"),
      });

      console.log("stake 10 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarOracleStrict2.save(
        epoch0,
        hre.ethers.utils.parseEther("0.004")
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = hre.ethers.utils.parseEther("0.004");

      console.log("distribute 0.004 eth rewards");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      await stakeStarOracleStrict1.save(
        epoch0 + 1,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.008"))
      );
      await stakeStarOracleStrict2.save(
        epoch0 + 1,
        rewardsGiven.add(hre.ethers.utils.parseEther("0.008"))
      );
      await stakeStarPublic.commitSnapshot();
      rewardsGiven = rewardsGiven.add(hre.ethers.utils.parseEther("0.008"));

      console.log("distribute additional 0.008 eth");
      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)
          )
        ),
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)).toNumber()
      );
      console.log(
        "rate on epoch0 + 3 before stakes",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 3)
          )
        ),
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 3)).toNumber()
      );
      console.log(
        "rate on epoch0 + 4 before stakes",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 4)
          )
        ),
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 4)).toNumber()
      );
      console.log();

      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)).toNumber(),
      ]);
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("1"));

      console.log();
      console.log(
        "rate on epoch0 + 2 after first stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)
          )
        )
      );
      console.log(
        "rate on epoch0 + 3 after first stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 3)
          )
        )
      );
      console.log(
        "rate on epoch0 + 4 after first stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 4)
          )
        )
      );
      console.log();

      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        (await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 3)).toNumber(),
      ]);
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("1"),
      });
      await hre.network.provider.request({ method: "evm_mine", params: [] });
      totalStaked = totalStaked.add(hre.ethers.utils.parseEther("1"));
      await stakeStarPublic.deposit({
        value: hre.ethers.utils.parseEther("1"),
      });

      console.log();
      console.log(
        "rate on epoch0 + 2 after second stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 2)
          )
        )
      );
      console.log(
        "rate on epoch0 + 3 after second stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 3)
          )
        )
      );
      console.log(
        "rate on epoch0 + 4 after second stake",
        humanify(
          await stakeStarPublic["rate(uint256)"](
            await stakeStarOracleStrict1.epochToTimestamp(epoch0 + 4)
          )
        )
      );
      console.log();

      poolBalance = await provider.getBalance(stakeStarPublic.address);
      treasuryBalance = await provider.getBalance(stakeStarTreasury.address);
      totalSupply_ssETH = await sstarETH.totalSupply();
      totalSupply_ETH = await stakeStarPublic.stakedStarToETH(
        totalSupply_ssETH
      );
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
        .add(hre.ethers.utils.parseEther("0.008"))
        .add(hre.ethers.utils.parseEther("0.008"));
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

    it("rateDiffThreshold", async function () {
      const {
        hre,
        stakeStarPublic,
        stakeStarOwner,
        stakeStarTreasury,
        sstarETH,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
      } = await loadFixture(deployStakeStarFixture);
      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;
      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );
      const baseEpochNumber = currentEpochNumber - 1000;

      await stakeStarTreasury.setCommission(10000); // 10%
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("10"),
      });
      await stakeStarOwner.setRateParameters(2000, true);

      await stakeStarOracleStrict1.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.2")
      );
      await stakeStarOracleStrict2.save(
        baseEpochNumber + 1,
        hre.ethers.utils.parseEther("0.2")
      );
      await stakeStarPublic.commitSnapshot();

      await stakeStarOwner.setCommissionParameters(
        hre.ethers.utils.parseEther("1")
      );
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.1"),
      });

      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.be.eq(0);

      await stakeStarOwner.setCommissionParameters(
        hre.ethers.utils.parseEther("0.01")
      );
      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("0.1"),
      });
      expect(await sstarETH.balanceOf(stakeStarTreasury.address)).to.be.gt(0);
    });
  });
});
