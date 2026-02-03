const { ethers } = require("hardhat");

async function runDemo() {
  const [deployer, bnpManager, citiManager, ...customers] = await ethers.getSigners();

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

  console.log("=== Banking Consortium Demo ===\n");

  // Demo 1: Deposits
  console.log("1. Making deposits...");
  const depositAmount = ethers.parseUnits("1000.00", 2); // 1000.00 tokens
  
  for (let i = 0; i < 3; i++) {
    const tx = await bnpBank.connect(customers[i]).deposit({
      value: depositAmount
    });
    await tx.wait();
    console.log(`BNP Customer ${i+1} deposited 1000 tokens`);
  }

  // Demo 2: Convert to stable coins
  console.log("\n2. Converting to stable coins...");
  const convertAmount = ethers.parseUnits("500.00", 2);
  
  await bnpBank.connect(customers[0]).convertToStableCoin(convertAmount);
  console.log("BNP Customer 1 converted 500 tokenized deposits to stable coins");

  // Check balances
  const tdBalance = await tokenizedDeposit.balanceOf(customers[0].address);
  const scBalance = await stableCoin.balanceOf(customers[0].address);
  console.log(`Tokenized Deposit Balance: ${ethers.formatUnits(tdBalance, 2)}`);
  console.log(`Stable Coin Balance: ${ethers.formatUnits(scBalance, 2)}`);

  // Demo 3: Inter-bank transfer
  console.log("\n3. Inter-bank transfer...");
  await stableCoin.connect(customers[0]).transfer(customers[3].address, convertAmount);
  console.log("BNP Customer 1 transferred 500 stable coins to Citi Customer 1");

  // Demo 4: Convert back to tokenized deposits
  console.log("\n4. Converting stable coins to tokenized deposits...");
  await citiBank.connect(customers[3]).convertToTokenizedDeposit(convertAmount);
  console.log("Citi Customer 1 converted 500 stable coins to tokenized deposits");

  // Demo 5: Intra-bank transfer
  console.log("\n5. Intra-bank transfer...");
  await citiBank.connect(customers[3]).intraBankTransfer(customers[4].address, 
    ethers.parseUnits("200.00", 2));
  console.log("Citi Customer 1 transferred 200 tokenized deposits to Citi Customer 2");

  // Demo 6: Check reserves
  console.log("\n6. Checking bank reserves...");
  const bnpReserve = await consortium.getBankReserve("BNP");
  const citiReserve = await consortium.getBankReserve("CITI");
  const totalReserve = await consortium.getTotalReserve();
  
  console.log(`BNP Reserve: ${ethers.formatUnits(bnpReserve, 2)}`);
  console.log(`Citi Reserve: ${ethers.formatUnits(citiReserve, 2)}`);
  console.log(`Total Reserve: ${ethers.formatUnits(totalReserve, 2)}`);

  // Demo 7: Withdrawal
  console.log("\n7. Withdrawal...");
  const withdrawalAmount = ethers.parseUnits("100.00", 2);
  await bnpBank.connect(customers[0]).withdraw(withdrawalAmount);
  console.log("BNP Customer 1 withdrew 100 tokens");

  console.log("\n=== Demo Complete ===");
}

runDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });