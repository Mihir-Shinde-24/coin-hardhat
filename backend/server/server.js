const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const CounterArtifact = require('./../artifacts/contracts/Counter.sol/Counter.json');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Read contract address from file
let contractAddress;
try {
  contractAddress = require('./../../frontend/src/app/contract-address.json');
} catch (error) {
  console.error("Error reading contract address:", error.message);
  console.log("Please deploy the contract first using: npm run deploy");
  process.exit(1);
}

let provider;
let signer;
let contract;

// Initialize Ethereum connection
async function initialize() {
  try {
    // 1. Create provider
    provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // 2. SIMPLER: Always use getSigner(0) for Hardhat
    signer = await provider.getSigner(0);
    console.log("✅ Signer address:", await signer.getAddress());
    
    // 3. Load contract data
    const contractData = require('../../frontend/src/app/contract-address.json');
    const abi = require('../../frontend/src/app/counter-abi.json');
    
    // 4. Create contract
    contract = new ethers.Contract(contractData.address, abi, signer);
    
    console.log("✅ Contract ready at:", contractData.address);
    
    // Test
    const count = await contract.getCount();
    console.log("📊 Initial count:", count.toString());
    
  } catch (error) {
    console.error("❌ Setup error:", error.message);
  }
}

initialize();

// API endpoints
app.get('/api/count', async (req, res) => {
  try {
    const count = await contract.getCount();
    res.json({ 
      success: true, 
      count: count.toString() 
    });
  } catch (error) {
    console.error("Error getting count:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/increment', async (req, res) => {
  try {
    console.log("Incrementing counter...");
    const tx = await contract.increment();
    console.log("Transaction sent:", tx.hash);
    
    await tx.wait();
    console.log("Transaction confirmed");
    
    const newCount = await contract.getCount();
    res.json({ 
      success: true, 
      count: newCount.toString(),
      transactionHash: tx.hash 
    });
  } catch (error) {
    console.error("Error incrementing:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/contract-info', (req, res) => {
  res.json({ 
    success: true, 
    address: contractAddress.address 
  });
});


app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  console.log(`Contract address: ${contractAddress.address}`);
});