// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenizedDeposit is ERC20, Ownable {
    mapping(address => bool) public banks;
    
    event BankMint(address indexed to, uint256 amount);
    event BankBurn(address indexed from, uint256 amount);
    event IntraBankTransfer(address indexed from, address indexed to, uint256 amount);
    
    constructor() ERC20("TokenizedDeposit", "TKD") Ownable(msg.sender) {
        // No consortium reference needed
    }
    
    modifier onlyBank() {
        require(banks[msg.sender], "Only banks can call this");
        _;
    }
    
    function addBank(address bank) external onlyOwner {
        banks[bank] = true;
    }
    
    function bankMint(address to, uint256 amount) external onlyBank {
        _mint(to, amount);
        emit BankMint(to, amount);
    }
    
    function bankBurn(address from, uint256 amount) external onlyBank {
        _burn(from, amount);
        emit BankBurn(from, amount);
    }
    
    function intraBankTransfer(address to, uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, to, amount);
        emit IntraBankTransfer(msg.sender, to, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 2; // 2 decimal places for cents
    }
}