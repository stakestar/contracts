// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract StakeStarRegistry is Initializable, AccessControlUpgradeable {
    event AddOperatorToAllowList(uint32 operatorId);
    event RemoveOperatorFromAllowList(uint32 operatorId);
    event CreateValidator(bytes publicKey);
    event DestroyValidator(bytes publicKey);

    enum ValidatorStatus {
        MISSING,
        CREATED,
        DESTROYED
    }

    bytes32 public constant STAKE_STAR_ROLE = keccak256("StakeStar");

    mapping(uint32 => bool) public allowListOfOperators;
    mapping(bytes => ValidatorStatus) public validatorStatuses;
    bytes[] public validatorPublicKeys;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addOperatorToAllowList(uint32 operatorId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!allowListOfOperators[operatorId], "operator already added");
        allowListOfOperators[operatorId] = true;
        emit AddOperatorToAllowList(operatorId);
    }

    function removeOperatorFromAllowList(uint32 operatorId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(allowListOfOperators[operatorId], "operator not added");
        delete allowListOfOperators[operatorId];
        emit RemoveOperatorFromAllowList(operatorId);
    }

    function createValidator(bytes memory publicKey) public onlyRole(STAKE_STAR_ROLE) {
        require(validatorStatuses[publicKey] == ValidatorStatus.MISSING, "validator status not MISSING");
        validatorStatuses[publicKey] = ValidatorStatus.CREATED;
        validatorPublicKeys.push(publicKey);
        emit CreateValidator(publicKey);
    }

    function destroyValidator(bytes memory publicKey) public onlyRole(STAKE_STAR_ROLE) {
        require(validatorStatuses[publicKey] == ValidatorStatus.CREATED, "validator status not CREATED");
        validatorStatuses[publicKey] = ValidatorStatus.DESTROYED;
        emit DestroyValidator(publicKey);
    }

    function getValidatorPublicKeys(ValidatorStatus status) public view returns (bytes[] memory publicKeys) {
        publicKeys = new bytes[](validatorPublicKeys.length);

        for (uint32 i = 0; i < validatorPublicKeys.length; i++) {
            bytes memory publicKey = validatorPublicKeys[i];
            if (validatorStatuses[publicKey] == status) {
                publicKeys[i] = publicKey;
            }
        }
    }

    function countValidatorPublicKeys(ValidatorStatus status) public view returns (uint32 count) {
        count = 0;

        for (uint32 i = 0; i < validatorPublicKeys.length; i++) {
            bytes memory publicKey = validatorPublicKeys[i];
            ValidatorStatus validatorStatus = validatorStatuses[publicKey];
            if (status == ValidatorStatus.CREATED &&
                (validatorStatus == ValidatorStatus.CREATED || validatorStatus == ValidatorStatus.DESTROYED)) {
                count++;
            } else if (status == ValidatorStatus.DESTROYED && validatorStatus == ValidatorStatus.DESTROYED) {
                count++;
            }
        }
    }
}
