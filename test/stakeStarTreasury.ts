import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./test-helpers/fixture";
import { ConstantsLib } from "../scripts/constants";
import { ethers } from "ethers";
import { retrieveCluster } from "../scripts/helpers";
import { createValidator } from "./test-helpers/wrappers";

describe("StakeStarTreasury", function () {
  describe("Deployment", function () {
    it("Should set the right DEFAULT_ADMIN_ROLE", async function () {
      const { stakeStarTreasury, owner, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarTreasury.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarTreasury.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
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
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
      );
      await expect(
        stakeStarTreasury
          .connect(otherAccount)
          .setAddresses(
            stakeStarTreasury.address,
            stakeStarTreasury.address,
            stakeStarTreasury.address,
            stakeStarTreasury.address,
            stakeStarTreasury.address
          )
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
      );
      await expect(
        stakeStarTreasury.connect(otherAccount).setRunway(1, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
      );
      await expect(
        stakeStarTreasury.connect(otherAccount).claim(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
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

  describe("Setters", function () {
    describe("SetAddresses", function () {
      it("Should set addresses", async function () {
        const {
          stakeStarTreasury,
          stakeStarPublic,
          uniswapV3Provider,
          addresses,
        } = await loadFixture(deployStakeStarFixture);

        await expect(
          stakeStarTreasury.setAddresses(
            stakeStarPublic.address,
            addresses.ssvNetwork,
            addresses.ssvNetworkViews,
            addresses.ssvToken,
            uniswapV3Provider.address
          )
        )
          .to.emit(stakeStarTreasury, "SetAddresses")
          .withArgs(
            stakeStarPublic.address,
            addresses.ssvNetwork,
            addresses.ssvNetworkViews,
            addresses.ssvToken,
            uniswapV3Provider.address
          );

        expect(await stakeStarTreasury.stakeStar()).to.eq(
          stakeStarPublic.address
        );
        expect(await stakeStarTreasury.ssvNetwork()).to.eq(
          addresses.ssvNetwork
        );
        expect(await stakeStarTreasury.ssvNetworkViews()).to.eq(
          addresses.ssvNetworkViews
        );
        expect(await stakeStarTreasury.ssvToken()).to.eq(addresses.ssvToken);
        expect(await stakeStarTreasury.swapProvider()).to.eq(
          uniswapV3Provider.address
        );
      });
    });

    describe("SetCommission", function () {
      it("Should set commission", async function () {
        const { stakeStarTreasury } = await loadFixture(deployStakeStarFixture);

        expect(await stakeStarTreasury.commission()).to.eq(0);
        expect(await stakeStarTreasury.getCommission(1000)).to.eq(0);

        await expect(
          stakeStarTreasury.setCommission(100_001)
        ).to.be.revertedWith(`value must be in [0, 100_000]`);

        await stakeStarTreasury.setCommission(0);
        await stakeStarTreasury.setCommission(100_000);

        await expect(stakeStarTreasury.setCommission(7000))
          .to.emit(stakeStarTreasury, "SetCommission")
          .withArgs(7000);

        expect(await stakeStarTreasury.commission()).to.eq(7000);
        expect(await stakeStarTreasury.getCommission(1000)).to.eq(70);
      });
    });

    describe("SetRunway", function () {
      it("Should set runway", async function () {
        const { stakeStarTreasury } = await loadFixture(deployStakeStarFixture);

        expect(await stakeStarTreasury.minRunway()).to.eq(0);
        expect(await stakeStarTreasury.maxRunway()).to.eq(0);

        await expect(stakeStarTreasury.setRunway(3, 1)).to.be.revertedWith(
          "minRunway > maxRunway"
        );

        await expect(stakeStarTreasury.setRunway(8, 9))
          .to.emit(stakeStarTreasury, "SetRunway")
          .withArgs(8, 9);

        expect(await stakeStarTreasury.minRunway()).to.eq(8);
        expect(await stakeStarTreasury.maxRunway()).to.eq(9);
      });
    });
  });

  describe("swapETHAndDepositSSV", function () {
    it("Should buy SSV token on UNI V3 and deposit", async function () {
      const {
        stakeStarPublic,
        hre,
        stakeStarTreasury,
        stakeStarManager,
        stakeStarRegistry,
        ssvToken,
        ssvNetwork,
        ssvNetworkViews,
        uniswapV3Provider,
        manager,
        validatorParams1,
        operatorIDs,
        owner,
        otherAccount,
      } = await loadFixture(deployStakeStarFixture);
      let cluster;

      await stakeStarTreasury.grantRole(
        ConstantsLib.MANAGER_ROLE,
        owner.address
      );

      await ssvToken
        .connect(owner)
        .transfer(
          otherAccount.address,
          (
            await ssvToken.balanceOf(owner.address)
          ).sub(hre.ethers.utils.parseEther("2"))
        );

      await stakeStarPublic.depositAndStake({
        value: hre.ethers.utils.parseEther("32"),
      });

      await createValidator(
        hre,
        stakeStarPublic,
        stakeStarRegistry,
        validatorParams1
      );

      cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarPublic.address,
        operatorIDs
      );

      await expect(
        stakeStarTreasury.swapETHAndDepositSSV(operatorIDs, cluster)
      ).to.be.revertedWith("runway not set");
      await stakeStarTreasury.setRunway(216000, 216000 * 3); // 1 month, 3 months
      await expect(
        stakeStarTreasury.swapETHAndDepositSSV(operatorIDs, cluster)
      ).to.be.revertedWith("swap not available");

      await manager.sendTransaction({
        to: stakeStarTreasury.address,
        value: ethers.utils.parseEther("10"),
      });

      await expect(
        stakeStarTreasury.swapETHAndDepositSSV(operatorIDs, cluster)
      ).to.be.revertedWith("swap not available");
      await stakeStarTreasury.setRunway(
        (2 * 30 * 24 * 3600) / 12,
        (6 * 30 * 24 * 3600) / 12
      );

      const aBalance = await ssvNetworkViews.getBalance(
        stakeStarManager.address,
        operatorIDs,
        cluster
      );
      const aBurnRate = await ssvNetworkViews.getBurnRate(
        stakeStarManager.address,
        operatorIDs,
        cluster
      );

      expect(aBalance).to.be.greaterThan(0);
      expect(aBurnRate).to.be.greaterThan(0);

      await uniswapV3Provider.setParameters(
        3000,
        0,
        30 * 60,
        ethers.utils.parseEther("999999")
      );
      await expect(
        stakeStarTreasury.swapETHAndDepositSSV(operatorIDs, cluster)
      ).to.be.revertedWith("insufficient liquidity");
      await uniswapV3Provider.setParameters(
        3000,
        0,
        30 * 60,
        ethers.utils.parseEther("0.1")
      );

      await expect(
        stakeStarTreasury.swapETHAndDepositSSV(operatorIDs, cluster)
      ).to.be.revertedWith("slippage not set");
      await uniswapV3Provider.setParameters(
        3000,
        99999,
        30 * 60,
        ethers.utils.parseEther("0.1")
      );

      await expect(
        stakeStarTreasury.swapETHAndDepositSSV(operatorIDs, cluster)
      ).to.be.revertedWith("Too little received");

      await uniswapV3Provider.setParameters(
        3000,
        97000,
        30 * 60,
        ethers.utils.parseEther("0.1")
      );
      expect(
        await stakeStarTreasury.swapETHAndDepositSSV(operatorIDs, cluster)
      ).to.emit(stakeStarTreasury, "SwapETHAndDepositSSV");

      cluster = await retrieveCluster(
        hre,
        ssvNetwork.address,
        stakeStarPublic.address,
        operatorIDs
      );

      const aBalance2 = await ssvNetworkViews.getBalance(
        stakeStarManager.address,
        operatorIDs,
        cluster
      );
      expect(aBalance2).to.be.greaterThan(aBalance);

      expect(
        await uniswapV3Provider.provider.getBalance(uniswapV3Provider.address)
      ).to.equal(0);
      expect(
        await stakeStarTreasury.provider.getBalance(stakeStarTreasury.address)
      ).to.be.greaterThan(0);
    });
  });

  describe("Claim", function () {
    it("Should emit Pull event", async function () {
      const { stakeStarTreasury, owner, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      await expect(stakeStarTreasury.claim(1)).to.be.revertedWith("STE");

      await otherAccount.sendTransaction({
        to: stakeStarTreasury.address,
        value: 5000,
      });

      await expect(stakeStarTreasury.claim(5000))
        .to.emit(stakeStarTreasury, "Claim")
        .withArgs(5000);

      await otherAccount.sendTransaction({
        to: stakeStarTreasury.address,
        value: 6000,
      });

      await expect(stakeStarTreasury.claim(6000)).to.changeEtherBalances(
        [owner, stakeStarTreasury],
        [6000, -6000]
      );

      await otherAccount.sendTransaction({
        to: stakeStarTreasury.address,
        value: 1000,
      });

      await expect(stakeStarTreasury.claim(500)).to.changeEtherBalances(
        [owner, stakeStarTreasury],
        [500, -500]
      );
    });
  });
});
