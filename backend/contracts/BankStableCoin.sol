// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BankStableCoin is ERC20, Ownable {
    mapping(address => bool) public banks;
    
    constructor() ERC20("BankStableCoin", "BSC") Ownable(msg.sender) {
        // No consortium reference needed
    }
    
    modifier onlyBank() {
        require(banks[msg.sender], "Only banks can call this");
        _;
    }
    
    function addBank(address bank) external onlyOwner {
        banks[bank] = true;
    }
    
    function mint(address to, uint256 amount) external onlyBank {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyBank {
        _burn(from, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 2; // 2 decimal places for cents
    }
}