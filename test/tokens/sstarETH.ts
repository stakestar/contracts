import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture/fixture";
import { ConstantsLib } from "../../scripts/constants";

describe("SStarETH", function () {
  describe("Deployment", function () {
    it("Should set the right token name and symbol", async function () {
      const { sstarETH } = await loadFixture(deployStakeStarFixture);

      expect(await sstarETH.name()).to.equal("SStarETH");
      expect(await sstarETH.symbol()).to.equal("sstarETH");
    });

    it("Should set the right STAKE_STAR_ROLE", async function () {
      const { stakeStarPublic, sstarETH, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await sstarETH.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await sstarETH.hasRole(ConstantsLib.STAKE_STAR_ROLE, owner.address)
      ).to.equal(false);
      expect(
        await sstarETH.hasRole(
          ConstantsLib.STAKE_STAR_ROLE,
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await sstarETH.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          stakeStarPublic.address
        )
      ).to.equal(false);
      expect(
        await sstarETH.hasRole(ConstantsLib.DEFAULT_ADMIN_ROLE, owner.address)
      ).to.equal(true);
      expect(
        await sstarETH.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          otherAccount.address
        )
      ).to.equal(false);
    });

    it("Should not allow to call STAKE_STAR_ROLE method to anyone else", async function () {
      const { sstarETH, otherAccount } = await loadFixture(
        deployStakeStarFixture
      );

      const stakeStarRole = ConstantsLib.STAKE_STAR_ROLE;

      await expect(
        sstarETH.connect(otherAccount).mint(otherAccount.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${stakeStarRole}`
      );
      await expect(
        sstarETH.connect(otherAccount).burn(otherAccount.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${stakeStarRole}`
      );
    });
  });

  describe("Mint", function () {
    it("Should mint value of ssETH", async function () {
      const { sstarETH, owner } = await loadFixture(deployStakeStarFixture);

      await sstarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);

      await expect(sstarETH.mint(owner.address, 127))
        .to.emit(sstarETH, "Mint")
        .withArgs(owner.address, 127);

      expect(await sstarETH.balanceOf(owner.address)).to.equal(127);
    });
  });

  describe("Burn", function () {
    it("Should burn value of ssETH", async function () {
      const { sstarETH, owner } = await loadFixture(deployStakeStarFixture);

      await sstarETH.grantRole(ConstantsLib.STAKE_STAR_ROLE, owner.address);

      await sstarETH.mint(owner.address, 127);

      await expect(sstarETH.burn(owner.address, 27))
        .to.emit(sstarETH, "Burn")
        .withArgs(owner.address, 27);

      expect(await sstarETH.balanceOf(owner.address)).to.equal(100);
    });
  });
});
