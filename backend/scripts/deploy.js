const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy BankConsortium (it will deploy tokens and transfer ownership to itself)
  const BankConsortium = await ethers.getContractFactory("BankConsortium");
  const consortium = await BankConsortium.deploy();
  await consortium.waitForDeployment();
  const consortiumAddress = await consortium.getAddress();
  console.log("BankConsortium deployed to:", consortiumAddress);

  // Verify consortium owns the token contracts
  const stableCoin = await ethers.getContractAt("BankStableCoin", await consortium.stableCoin());
  const tokenizedDeposit = await ethers.getContractAt("TokenizedDeposit", await consortium.tokenizedDeposit());
  
  console.log("StableCoin owner:", await stableCoin.owner());
  console.log("TokenizedDeposit owner:", await tokenizedDeposit.owner());

  // Deploy banks
  const Bank = await ethers.getContractFactory("Bank");
  
  // Deploy BNP Bank
  const bnpBank = await Bank.deploy("BNP", consortiumAddress);
  await bnpBank.waitForDeployment();
  const bnpAddress = await bnpBank.getAddress();
  console.log("BNP Bank deployed to:", bnpAddress);
  
  // Deploy Citi Bank
  const citiBank = await Bank.deploy("CITI", consortiumAddress);
  await citiBank.waitForDeployment();
  const citiAddress = await citiBank.getAddress();
  console.log("Citi Bank deployed to:", citiAddress);

  // Register banks in consortium
  console.log("Registering banks in consortium...");
  await consortium.registerBank("BNP", bnpAddress, 60);
  await consortium.registerBank("CITI", citiAddress, 40);
  console.log("Banks registered in consortium");

  // Allocate reserve pool
  await consortium.allocateReservePool(10000000); // 100,000.00 coins (2 decimals)
  console.log("Reserve pool allocated");

  console.log("\n=== Deployment Summary ===");
  console.log("Consortium Address:", consortiumAddress);
  console.log("BNP Bank Address:", bnpAddress);
  console.log("Citi Bank Address:", citiAddress);
  console.log("Tokenized Deposit Address:", await consortium.tokenizedDeposit());
  console.log("Stable Coin Address:", await consortium.stableCoin());
  
  console.log("\n=== Verification ===");
  console.log("BNP is registered bank:", await consortium.banks("BNP"));
  console.log("CITI is registered bank:", await consortium.banks("CITI"));
  console.log("BNP is in stableCoin banks:", await stableCoin.banks(bnpAddress));
  console.log("BNP is in tokenizedDeposit banks:", await tokenizedDeposit.banks(bnpAddress));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });