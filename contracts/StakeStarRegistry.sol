// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/PoRAddressList.sol";

contract StakeStarRegistry is Initializable, AccessControlUpgradeable, PoRAddressList {
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

    function verifyOperators(uint32[] memory operatorIds) public view returns (bool) {
        for (uint8 i = 0; i < operatorIds.length; i++) {
            if (!allowListOfOperators[operatorIds[i]]) return false;
        }

        return true;
    }

    function getValidatorPublicKeysLength() public view returns (uint256) {
        return validatorPublicKeys.length;
    }

    function getValidatorPublicKeys(ValidatorStatus status) public view returns (bytes[] memory publicKeys) {
        publicKeys = new bytes[](validatorPublicKeys.length);

        for (uint256 i = 0; i < validatorPublicKeys.length; i++) {
            bytes memory publicKey = validatorPublicKeys[i];
            if (validatorStatuses[publicKey] == status) {
                publicKeys[i] = publicKey;
            }
        }
    }

    function countValidatorPublicKeys(ValidatorStatus status) public view returns (uint256 count) {
        count = 0;

        for (uint256 i = 0; i < validatorPublicKeys.length; i++) {
            if (status == validatorStatuses[validatorPublicKeys[i]]) {
                count++;
            }
        }
    }

    function getPoRAddressListLength() public view returns (uint256) {
        return countValidatorPublicKeys(ValidatorStatus.CREATED);
    }

    function getPoRAddressList(uint256 startIndex, uint256 endIndex) public view returns (string[] memory) {
        uint256 length = getPoRAddressListLength();
        if (length == 0) {
            return new string[](0);
        }

        uint256 normalizedEndIndex = endIndex < length - 1 ? endIndex : length - 1;
        if (startIndex > normalizedEndIndex) {
            return new string[](0);
        }

        string[] memory addressList = new string[](normalizedEndIndex - startIndex + 1);
        bytes[] memory publicKeys = getValidatorPublicKeys(ValidatorStatus.CREATED);
        uint256 relativeIndex = 0;
        uint256 returnIndex = 0;

        for (uint256 i = 0; i < publicKeys.length; i++) {
            bytes memory publicKey = publicKeys[i];
            if (publicKey.length > 0) {
                if (relativeIndex >= startIndex && relativeIndex <= endIndex) {
                    addressList[returnIndex] = toString(publicKey);
                    returnIndex++;
                }
                relativeIndex++;
            }
        }

        return addressList;
    }

    function toString(bytes memory data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}
