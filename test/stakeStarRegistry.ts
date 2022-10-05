import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "./fixture";
import { ValidatorStatus, ZERO_BYTES_STRING } from "../scripts/utils";
import { Wallet } from "ethers";

describe("StakeStarRegistry", function () {
  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { stakeStarPublic, stakeStarRegistry, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);
      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.DEFAULT_ADMIN_ROLE(),
          otherAccount.address
        )
      ).to.equal(false);

      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.STAKE_STAR_ROLE(),
          stakeStarPublic.address
        )
      ).to.equal(true);
      expect(
        await stakeStarRegistry.hasRole(
          await stakeStarRegistry.STAKE_STAR_ROLE(),
          owner.address
        )
      ).to.equal(false);
    });
  });

  describe("AccessControl", function () {
    it("Should not allow call methods without corresponding roles", async function () {
      const { stakeStarRegistry, validatorParams, owner, otherAccount } =
        await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarRegistry.connect(otherAccount).addOperatorToAllowList(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarRegistry.DEFAULT_ADMIN_ROLE()}`
      );
      await expect(
        stakeStarRegistry.connect(otherAccount).removeOperatorFromAllowList(1)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${await stakeStarRegistry.DEFAULT_ADMIN_ROLE()}`
      );

      await expect(
        stakeStarRegistry
          .connect(owner)
          .createValidator(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarRegistry.STAKE_STAR_ROLE()}`
      );
      await expect(
        stakeStarRegistry
          .connect(owner)
          .destroyValidator(validatorParams.publicKey)
      ).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarRegistry.STAKE_STAR_ROLE()}`
      );
    });
  });

  describe("AllowList", function () {
    it("Should add operator to the allow list", async function () {
      const { stakeStarRegistry, owner } = await loadFixture(
        deployStakeStarFixture
      );

      const operatorId = 1;

      await expect(
        stakeStarRegistry.connect(owner).addOperatorToAllowList(operatorId)
      )
        .to.emit(stakeStarRegistry, "AddOperatorToAllowList")
        .withArgs(operatorId);

      await expect(
        stakeStarRegistry.connect(owner).addOperatorToAllowList(operatorId)
      ).to.be.revertedWith("operator already added");

      expect(await stakeStarRegistry.allowListOfOperators(operatorId)).to.equal(
        true
      );
    });

    it("Should remove operator from the allow list", async function () {
      const { stakeStarRegistry, owner } = await loadFixture(
        deployStakeStarFixture
      );

      const operatorId = 1;

      await expect(
        stakeStarRegistry.connect(owner).removeOperatorFromAllowList(operatorId)
      ).to.be.revertedWith("operator not added");

      await stakeStarRegistry.connect(owner).addOperatorToAllowList(operatorId);

      await expect(
        stakeStarRegistry.connect(owner).removeOperatorFromAllowList(operatorId)
      )
        .to.emit(stakeStarRegistry, "RemoveOperatorFromAllowList")
        .withArgs(operatorId);

      expect(await stakeStarRegistry.allowListOfOperators(operatorId)).to.equal(
        false
      );
    });
  });

  describe("Validators", function () {
    it("Should create validator", async function () {
      const { stakeStarRegistry, owner } = await loadFixture(
        deployStakeStarFixture
      );

      await stakeStarRegistry
        .connect(owner)
        .grantRole(await stakeStarRegistry.STAKE_STAR_ROLE(), owner.address);

      const publicKey1 = Wallet.createRandom().publicKey;
      const publicKey2 = Wallet.createRandom().publicKey;

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.MISSING
      );

      await expect(stakeStarRegistry.connect(owner).createValidator(publicKey1))
        .to.emit(stakeStarRegistry, "CreateValidator")
        .withArgs(publicKey1);

      await expect(
        stakeStarRegistry.connect(owner).createValidator(publicKey1)
      ).to.be.revertedWith("validator status not MISSING");

      await stakeStarRegistry.connect(owner).createValidator(publicKey2);

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.CREATED
      );
      expect(await stakeStarRegistry.validatorStatuses(publicKey2)).to.equal(
        ValidatorStatus.CREATED
      );

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.MISSING)
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.MISSING
        )
      ).to.equal(0);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.CREATED)
      ).to.eql([publicKey1, publicKey2]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.CREATED
        )
      ).to.equal(2);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(
          ValidatorStatus.DESTROYED
        )
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.DESTROYED
        )
      ).to.equal(0);
    });

    it("Should destroy validator", async function () {
      const { stakeStarRegistry, owner } = await loadFixture(
        deployStakeStarFixture
      );

      await stakeStarRegistry
        .connect(owner)
        .grantRole(await stakeStarRegistry.STAKE_STAR_ROLE(), owner.address);

      const publicKey1 = Wallet.createRandom().publicKey;
      const publicKey2 = Wallet.createRandom().publicKey;
      const publicKey3 = Wallet.createRandom().publicKey;

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.MISSING
      );

      await expect(
        stakeStarRegistry.connect(owner).destroyValidator(publicKey1)
      ).to.be.revertedWith("validator status not CREATED");

      await expect(
        stakeStarRegistry.connect(owner).createValidator(publicKey1)
      );
      await expect(
        stakeStarRegistry.connect(owner).createValidator(publicKey2)
      );
      await expect(
        stakeStarRegistry.connect(owner).createValidator(publicKey3)
      );

      await expect(
        stakeStarRegistry.connect(owner).destroyValidator(publicKey1)
      )
        .to.emit(stakeStarRegistry, "DestroyValidator")
        .withArgs(publicKey1);

      await expect(
        stakeStarRegistry.connect(owner).destroyValidator(publicKey1)
      ).to.be.revertedWith("validator status not CREATED");

      expect(await stakeStarRegistry.validatorStatuses(publicKey1)).to.equal(
        ValidatorStatus.DESTROYED
      );

      await stakeStarRegistry.connect(owner).destroyValidator(publicKey2);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.MISSING)
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.MISSING
        )
      ).to.equal(0);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.CREATED)
      ).to.eql([ZERO_BYTES_STRING, ZERO_BYTES_STRING, publicKey3]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.CREATED
        )
      ).to.equal(3);

      expect(
        await stakeStarRegistry.getValidatorPublicKeys(
          ValidatorStatus.DESTROYED
        )
      ).to.eql([publicKey1, publicKey2, ZERO_BYTES_STRING]);
      expect(
        await stakeStarRegistry.countValidatorPublicKeys(
          ValidatorStatus.DESTROYED
        )
      ).to.equal(2);
    });
  });
});
