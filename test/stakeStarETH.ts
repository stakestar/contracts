import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";

describe("StakeStarETH", function () {
  describe("Deployment", function () {
    it("Should set the right token name and symbol", async function () {
      const { stakeStarETH } = await loadFixture(deployStakeStarFixture);

      expect(await stakeStarETH.name()).to.equal("StakeStar ETH");
      expect(await stakeStarETH.symbol()).to.equal("ssETH");
    });

    it("Should set the right STAKE_STAR_ROLE", async function () {
      const { stakeStarPublic, stakeStarETH, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.STAKE_STAR_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.STAKE_STAR_ROLE(),
          owner.address
        )
      ).to.equal(false);
      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.STAKE_STAR_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.DEFAULT_ADMIN_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(false);
      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(false);
      expect(
        await stakeStarETH.hasRole(
          await stakeStarETH.DEFAULT_ADMIN_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);
    });

    it("Should have rate equal to 1e18", async function () {
      const { stakeStarETH } = await loadFixture(deployStakeStarFixture);

      expect(await stakeStarETH.rate()).to.equal(1000000000000000000n);
    });

    it("Should not allow to call STAKE_STAR_ROLE method to anyone else", async function () {
      const { stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeStarRole = await stakeStarETH.STAKE_STAR_ROLE();

      await expect(
        stakeStarETH.connect(otherAccount).mint(otherAccount.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${stakeStarRole}`
      );
      await expect(
        stakeStarETH.connect(otherAccount).burn(otherAccount.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${stakeStarRole}`
      );
      await expect(
        stakeStarETH.connect(otherAccount).updateRate(1, true)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${stakeStarRole}`
      );
    });
  });

  describe("Mint", function () {
    it("Should mint msg.value of ssETH if rate is 1:1", async function () {
      const { stakeStarPublic, stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      expect(await stakeStarETH.rate()).to.equal(1000000000000000000n);

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      expect(await stakeStarETH.rate()).to.equal(1000000000000000000n);
      expect(await stakeStarETH.totalSupply()).to.equal(3);
    });

    it("Should mint msg.value * 2 of ssETH if rate 0.5", async function () {
      const { stakeStarOwner, stakeStarPublic, stakeStarETH, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await stakeStarOwner.applyPenalties(1);

      expect(await stakeStarETH.rate()).to.equal(500000000000000000n);
      expect(await stakeStarETH.totalSupply()).to.equal("2");

      await expect(stakeStarPublic.stake({ value: 2 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        4
      );
    });

    it("Should mint msg.value / 2 of ssETH if rate is 2", async function () {
      const { stakeStarPublic, stakeStarETH, stakeStarRewards, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await expect(stakeStarPublic.stake({ value: 1 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        1
      );

      await expect(
        otherAccount.sendTransaction({ to: stakeStarRewards.address, value: 1 })
      ).to.changeEtherBalances([otherAccount, stakeStarRewards], [-1, 1]);

      await expect(stakeStarPublic.applyRewards()).to.changeEtherBalances(
        [stakeStarRewards, stakeStarPublic],
        [-1, 1]
      );

      expect(await stakeStarETH.rate()).to.equal(2000000000000000000n);
      expect(await stakeStarETH.totalSupply()).to.equal("1");

      await expect(stakeStarPublic.stake({ value: 4 })).to.changeTokenBalance(
        stakeStarETH,
        otherAccount,
        2
      );
    });
  });
});
