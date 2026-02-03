// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BankConsortium.sol";

contract Bank {
    string public name;
    address public manager;
    BankConsortium public consortium;
    
    mapping(address => bool) public customers;
    address[] public customerList;
    
    event CustomerRegistered(address customer);
    event DepositMade(address customer, uint256 amount);
    event WithdrawalMade(address customer, uint256 amount);
    event ConversionToStable(address customer, uint256 amount);
    event ConversionToTokenized(address customer, uint256 amount);
    
    constructor(string memory _name, address _consortium) {
        name = _name;
        manager = msg.sender;
        consortium = BankConsortium(_consortium);
    }
    
    modifier onlyManager() {
        require(msg.sender == manager, "Only manager can call this");
        _;
    }
    
    modifier onlyCustomer() {
        require(customers[msg.sender], "Only registered customers can call this");
        _;
    }
    
    function registerCustomer(address customer) external onlyManager {
        require(!customers[customer], "Customer already registered");
        customers[customer] = true;
        customerList.push(customer);
        emit CustomerRegistered(customer);
    }
    
    function deposit() external payable onlyCustomer {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        // Mint tokenized deposit to customer
        consortium.tokenizedDeposit().bankMint(msg.sender, msg.value);
        
        emit DepositMade(msg.sender, msg.value);
    }
    
    function convertToStableCoin(uint256 amount) external onlyCustomer {
        require(
            consortium.tokenizedDeposit().balanceOf(msg.sender) >= amount,
            "Insufficient tokenized deposit"
        );
        
        bool success = consortium.convertToStableCoin(msg.sender, amount, name);
        require(success, "Conversion failed");
        
        emit ConversionToStable(msg.sender, amount);
    }
    
    function convertToTokenizedDeposit(uint256 amount) external onlyCustomer {
        require(
            consortium.stableCoin().balanceOf(msg.sender) >= amount,
            "Insufficient stable coins"
        );
        
        bool success = consortium.convertToTokenizedDeposit(msg.sender, amount, name);
        require(success, "Conversion failed");
        
        emit ConversionToTokenized(msg.sender, amount);
    }
    
    function intraBankTransfer(address to, uint256 amount) external onlyCustomer {
        require(customers[to], "Recipient must be a customer of this bank");
        consortium.tokenizedDeposit().intraBankTransfer(to, amount);
    }
    
    function withdraw(uint256 amount) external onlyCustomer {
        require(
            consortium.tokenizedDeposit().balanceOf(msg.sender) >= amount,
            "Insufficient tokenized deposit"
        );
        
        // Burn tokenized deposit
        consortium.tokenizedDeposit().bankBurn(msg.sender, amount);
        
        // Transfer ETH to customer
        payable(msg.sender).transfer(amount);
        
        emit WithdrawalMade(msg.sender, amount);
    }
    
    function getCustomerCount() external view returns (uint256) {
        return customerList.length;
    }
    
    function isCustomer(address addr) external view returns (bool) {
        return customers[addr];
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}