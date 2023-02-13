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
      await expect(
        stakeStarTreasury
          .connect(otherAccount)
          .setAddresses(
            stakeStarTreasury.address,
            stakeStarTreasury.address,
            stakeStarTreasury.address,
            stakeStarTreasury.address,
            stakeStarTreasury.address,
            stakeStarTreasury.address
          )
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarTreasury.DEFAULT_ADMIN_ROLE()}`
      );
      await expect(
        stakeStarTreasury.connect(otherAccount).setFee(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarTreasury.DEFAULT_ADMIN_ROLE()}`
      );
      await expect(
        stakeStarTreasury.connect(otherAccount).setRunway(1, 1)
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
  });

  describe("SetAddresses", function () {
    it("Should set addresses", async function () {
      const { stakeStarTreasury } = await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarTreasury.setAddresses(
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address
        )
      )
        .to.emit(stakeStarTreasury, "SetAddresses")
        .withArgs(
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address,
          stakeStarTreasury.address
        );

      expect(await stakeStarTreasury.stakeStar()).to.eq(
        stakeStarTreasury.address
      );
      expect(await stakeStarTreasury.wETH()).to.eq(stakeStarTreasury.address);
      expect(await stakeStarTreasury.ssvNetwork()).to.eq(
        stakeStarTreasury.address
      );
      expect(await stakeStarTreasury.ssvToken()).to.eq(
        stakeStarTreasury.address
      );
      expect(await stakeStarTreasury.swapRouter()).to.eq(
        stakeStarTreasury.address
      );
      expect(await stakeStarTreasury.quoter()).to.eq(stakeStarTreasury.address);
    });
  });

  describe("SetFee", function () {
    it("Should set fee", async function () {
      const { stakeStarTreasury } = await loadFixture(deployStakeStarFixture);

      await expect(stakeStarTreasury.setFee(7))
        .to.emit(stakeStarTreasury, "SetFee")
        .withArgs(7);

      expect(await stakeStarTreasury.fee()).to.eq(7);
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

  // describe("manageSSV", function () {
  //     it("Should buy SSV token on UNI V3", async function () {
  //       const { stakeStarOwner, addresses, ssvToken, ssvNetwork } =
  //         await loadFixture(deployStakeStarFixture);
  //
  //       expect(await ssvNetwork.getAddressBalance(stakeStarOwner.address)).to.eq(
  //         0
  //       );
  //
  //       const amountIn = BigNumber.from("100000000000000000"); // 0.1 eth
  //       const expectedAmountOut = BigNumber.from("14000000000000000000"); // 14 SSV
  //       const precision = BigNumber.from(1e7);
  //
  //       await stakeStarOwner.stake({ value: amountIn });
  //       await expect(
  //         stakeStarOwner.manageSSV(
  //           addresses.weth,
  //           3000,
  //           amountIn,
  //           expectedAmountOut
  //         )
  //       ).to.emit(stakeStarOwner, "ManageSSV");
  //
  //       expect(
  //         await ssvNetwork.getAddressBalance(stakeStarOwner.address)
  //       ).to.be.gte(expectedAmountOut);
  //       expect(await ssvToken.balanceOf(stakeStarOwner.address)).to.lt(precision);
  //     });
  //   });

  describe("Withdraw", function () {
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
