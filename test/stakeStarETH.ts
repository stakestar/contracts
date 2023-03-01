import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";
import { ConstantsLib } from "../scripts/constants";

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
          ConstantsLib.STAKE_STAR_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await stakeStarETH.hasRole(ConstantsLib.STAKE_STAR_ROLE, owner.address)
      ).to.equal(false);
      expect(
        await stakeStarETH.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await stakeStarETH.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(false);
      expect(
        await stakeStarETH.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarETH.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          otherAccount.address
        )
      ).to.equal(false);
    });

    it("Should not allow to call STAKE_STAR_ROLE method to anyone else", async function () {
      const { stakeStarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeStarRole = ConstantsLib.STAKE_STAR_ROLE;

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
    });
  });

  describe("Mint", function () {
    it("Should mint value of ssETH", async function () {
      const { stakeStarETH, owner } = await loadFixture(deployStakeStarFixture);

      await stakeStarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);

      await expect(stakeStarETH.mint(owner.address, 127))
        .to.emit(stakeStarETH, "Mint")
        .withArgs(owner.address, 127);

      expect(await stakeStarETH.balanceOf(owner.address)).to.equal(127);
    });
  });

  describe("Burn", function () {
    it("Should burn value of ssETH", async function () {
      const { stakeStarETH, owner } = await loadFixture(deployStakeStarFixture);

      await stakeStarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);

      await stakeStarETH.mint(owner.address, 127);

      await expect(stakeStarETH.burn(owner.address, 27))
        .to.emit(stakeStarETH, "Burn")
        .withArgs(owner.address, 27);

      expect(await stakeStarETH.balanceOf(owner.address)).to.equal(100);
    });
  });
});
