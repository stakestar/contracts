import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../test-helpers/fixture";
import { ConstantsLib } from "../../scripts/constants";

describe("StarETH", function () {
  describe("Deployment", function () {
    it("Should set the right token name and symbol", async function () {
      const { starETH } = await loadFixture(deployStakeStarFixture);

      expect(await starETH.name()).to.equal("StarETH");
      expect(await starETH.symbol()).to.equal("starETH");
    });

    it("Should set the right STAKE_STAR_ROLE", async function () {
      const { stakeStarPublic, starETH, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await starETH.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await starETH.hasRole(ConstantsLib.STAKE_STAR_ROLE, owner.address)
      ).to.equal(false);
      expect(
        await starETH.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await starETH.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(false);
      expect(
        await starETH.hasRole(ConstantsLib.DEFAULT_ADMIN_ROLE, owner.address)
      ).to.equal(true);
      expect(
        await starETH.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          otherAccount.address
        )
      ).to.equal(false);
    });

    it("Should not allow to call STAKE_STAR_ROLE method to anyone else", async function () {
      const { starETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeStarRole = ConstantsLib.STAKE_STAR_ROLE;

      await expect(
        starETH.connect(otherAccount).mint(otherAccount.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${stakeStarRole}`
      );
      await expect(
        starETH.connect(otherAccount).burn(otherAccount.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${stakeStarRole}`
      );
    });
  });

  describe("Mint", function () {
    it("Should mint value of ssETH", async function () {
      const { starETH, owner } = await loadFixture(deployStakeStarFixture);

      await starETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);

      await expect(starETH.mint(owner.address, 127))
        .to.emit(starETH, "Mint")
        .withArgs(owner.address, 127);

      expect(await starETH.balanceOf(owner.address)).to.equal(127);
    });
  });

  describe("Burn", function () {
    it("Should burn value of ssETH", async function () {
      const { starETH, owner } = await loadFixture(deployStakeStarFixture);

      await starETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);

      await starETH.mint(owner.address, 127);

      await expect(starETH.burn(owner.address, 27))
        .to.emit(starETH, "Burn")
        .withArgs(owner.address, 27);

      expect(await starETH.balanceOf(owner.address)).to.equal(100);
    });
  });
});
