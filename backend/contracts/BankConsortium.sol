// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Bank.sol";
import "./BankStableCoin.sol";
import "./TokenizedDeposit.sol";

contract BankConsortium {
    address public owner;
    BankStableCoin public stableCoin;
    TokenizedDeposit public tokenizedDeposit;

    function getTokenizedDeposit() external view returns (TokenizedDeposit) {
        return tokenizedDeposit;
    }
    
    struct BankInfo {
        address bankAddress;
        string name;
        uint256 reserveAllocation;
        uint256 currentReserve;
        bool isActive;
    }
    
    mapping(string => BankInfo) public banks;
    mapping(address => string) public bankAddressToName;
    string[] public bankNames;
    
    uint256 public totalReservePool;
    
    event BankRegistered(string bankName, address bankAddress, uint256 reserveAllocation);
    event ReserveAllocated(uint256 totalReserve);
    event InterBankTransfer(address from, address to, uint256 amount, string fromBank, string toBank);
    
    constructor() {
        owner = msg.sender;
        stableCoin = new BankStableCoin();
        tokenizedDeposit = new TokenizedDeposit();
        
        // Transfer ownership of token contracts to this consortium
        stableCoin.transferOwnership(address(this));
        tokenizedDeposit.transferOwnership(address(this));
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyBank() {
        require(banks[bankAddressToName[msg.sender]].isActive, "Only registered banks can call this");
        _;
    }
    
    function registerBank(
        string memory bankName,
        address bankAddress,
        uint256 reserveAllocation
    ) external onlyOwner {
        require(banks[bankName].bankAddress == address(0), "Bank already registered");
        
        banks[bankName] = BankInfo({
            bankAddress: bankAddress,
            name: bankName,
            reserveAllocation: reserveAllocation,
            currentReserve: 0,
            isActive: true
        });
        
        bankAddressToName[bankAddress] = bankName;
        bankNames.push(bankName);
        
        // Add bank to token contracts (consortium is now the owner)
        stableCoin.addBank(bankAddress);
        tokenizedDeposit.addBank(bankAddress);
        
        emit BankRegistered(bankName, bankAddress, reserveAllocation);
    }
    
    function allocateReservePool(uint256 totalPool) external onlyOwner {
        totalReservePool = totalPool;
        uint256 remaining = totalPool;
        
        for(uint256 i = 0; i < bankNames.length; i++) {
            BankInfo storage bank = banks[bankNames[i]];
            uint256 allocation = (totalPool * bank.reserveAllocation) / 100;
            bank.currentReserve = allocation;
            remaining -= allocation;
        }
        
        if(remaining > 0) {
            banks[bankNames[0]].currentReserve += remaining;
        }
        
        emit ReserveAllocated(totalPool);
    }
    
    function convertToStableCoin(
        address user,
        uint256 amount,
        string memory bankName
    ) external onlyBank returns (bool) {
        BankInfo storage bank = banks[bankName];
        require(bank.currentReserve >= amount, "Insufficient reserve");
        
        // Burn tokenized deposit
        tokenizedDeposit.bankBurn(user, amount);
        
        // Update bank reserve
        bank.currentReserve -= amount;
        
        // Mint stable coin
        stableCoin.mint(user, amount);
        
        return true;
    }
    
    function convertToTokenizedDeposit(
        address user,
        uint256 amount,
        string memory bankName
    ) external onlyBank returns (bool) {
        // Burn stable coin
        stableCoin.burn(user, amount);
        
        // Update bank reserve
        banks[bankName].currentReserve += amount;
        
        // Mint tokenized deposit
        tokenizedDeposit.bankMint(user, amount);
        
        return true;
    }
    
    function processInterBankTransfer(
        address from,
        address to,
        uint256 amount,
        string memory fromBank,
        string memory toBank
    ) external onlyBank {
        // Stable coin should be transferred first by user
        // This function just validates and logs
        emit InterBankTransfer(from, to, amount, fromBank, toBank);
    }
    
    function getBankReserve(string memory bankName) external view returns (uint256) {
        return banks[bankName].currentReserve;
    }
    
    function getTotalReserve() external view returns (uint256) {
        uint256 total = 0;
        for(uint256 i = 0; i < bankNames.length; i++) {
            total += banks[bankNames[i]].currentReserve;
        }
        return total;
    }

 
}