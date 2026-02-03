const { ethers } = require("hardhat");

async function setupDemo() {
  const [deployer, bnpManager, citiManager, ...customers] = await ethers.getSigners();
  



  // Get deployed contracts - REPLACE THESE WITH YOUR ACTUAL DEPLOYED ADDRESSES

  const CONSORTIUM_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
  const BNP_BANK_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
  const CITI_BANK_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 
  const TOKENIZED_DEPOSIT_ADDRESS = "0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968";
  const STABLE_COIN_ADDRESS = "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be";

  // Get deployed contracts
  const consortium = await ethers.getContractAt("BankConsortium", CONSORTIUM_ADDRESS);
  const bnpBank = await ethers.getContractAt("Bank", BNP_BANK_ADDRESS);
  const citiBank = await ethers.getContractAt("Bank", CITI_BANK_ADDRESS);
  const tokenizedDeposit = await ethers.getContractAt("TokenizedDeposit", TOKENIZED_DEPOSIT_ADDRESS);
  const stableCoin = await ethers.getContractAt("BankStableCoin", STABLE_COIN_ADDRESS);

  console.log("Setting up demo environment...");

  // Register 3 customers for BNP
  console.log("\nRegistering BNP customers:");
  for (let i = 0; i < 3; i++) {
    await bnpBank.connect(bnpManager).registerCustomer(customers[i].address);
    console.log(`Registered ${customers[i].address} as BNP customer`);
  }

  // Register 3 customers for Citi
  console.log("\nRegistering Citi customers:");
  for (let i = 3; i < 6; i++) {
    await citiBank.connect(citiManager).registerCustomer(customers[i].address);
    console.log(`Registered ${customers[i].address} as Citi customer`);
  }

  // Fund customers with ETH for deposits
  console.log("\nFunding customers with ETH...");
  for (let i = 0; i < 6; i++) {
    const fundAmount = ethers.parseEther("10.0");
    await deployer.sendTransaction({
      to: customers[i].address,
      value: fundAmount,
    });
    console.log(`Funded ${customers[i].address} with 10 ETH`);
  }

  console.log("\n=== Setup Complete ===");
  console.log("BNP Customers:", customers.slice(0, 3).map(c => c.address));
  console.log("Citi Customers:", customers.slice(3, 6).map(c => c.address));
  console.log("\nCommands to run demo:");
  console.log("1. Customers can deposit ETH to get tokenized deposits");
  console.log("2. Convert tokenized deposits to stable coins");
  console.log("3. Transfer stable coins between banks");
  console.log("4. Transfer tokenized deposits within same bank");
  console.log("5. Convert stable coins back to tokenized deposits");
}

setupDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });