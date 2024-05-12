import express from "express";
import cors from "cors";
import * as ethers from "ethers";
import { getContractAddress } from "@ethersproject/address";
import { MongoClient } from "mongodb";
import ERC20ABI from "./erc20.api.json" assert { type: "json" };
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 5000;
app.use(
  cors({
    origin: "*",
    methods: ["GET"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
    ],
  })
);
app.get('/api/v1/anaylizesimiliartoken', (req, res) => {
  res.send('Hello from Node API!');
  TokenScanScript();
});

const MONGO_URI =
  "mongodb+srv://devtgmsg:bldMyDr3amZ@cluster0.y3hfx1m.mongodb.net/";
const client = new MongoClient(MONGO_URI);
const allDocuments = [];

const TokenScanScript = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB server");
    const database = client.db("ERC20PnL");
    const byteCodes = database.collection("byteCodes");
    const existingDocuments = await byteCodes.find({}).toArray();
    allDocuments.push(...existingDocuments);
    
    const changeStream = byteCodes.watch();
    changeStream.on("change", async (change) => {
      const newDocument = change.fullDocument;
      allDocuments.push(newDocument);
      console.log("newDocument ::", newDocument);
      console.log("bytecodes=>", allDocuments); // Log bytecodes array here
    });
    search();
    changeStream.on("error", (error) => {
      console.error("Change stream error:", error);
    });
    await new Promise((resolve) => {
      process.on("SIGINT", resolve);
    });
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
  }
};

const provider = new ethers.WebSocketProvider(process.env.WebSocketProvider);
console.log("provider=>", process.env.WebSocketProvider);
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
}

const search = async () => {
  try {
    provider.on("block", async (block) => {
      // console.log(`allDocuments: ${allDocuments}`);
      console.log(`Block Number: ${block}`);
      try {
        const blockData = await provider.getBlock(block);
        const txes = await blockData.transactions;
        let a = 0;
        for (let a = 0; a < txes.length; a++) {
          const tx = await provider.getTransaction(txes[a]);
          //console.log(tx)
          try {
            if (tx.to === null) {
              const FoundCode = tx.data;
              let highestSimilarity = 0;
              let highestSimilarityContract = 0;
              let potential_scam;
              const deployer = tx.from;
              const deployerNonce =
                (await provider.getTransactionCount(deployer)) - 1;
              const createdAddress = getContractAddress({
                from: deployer,
                nonce: deployerNonce,
              });

              const contract = new ethers.Contract(
                createdAddress,
                ERC20ABI,
                provider
              );
              let name, symbol, decimals, totalSupply;
              try {
                name = await contract.name();
                symbol = await contract.symbol();
                decimals = await contract.decimals();
                totalSupply = await contract.totalSupply();
              } catch (err) {
                if (err.code === "CALL_EXCEPTION") break;
              }

              if (
                name &&
                symbol &&
                decimals.toString() &&
                totalSupply.toString()
              ) {
                for (let i = 0; i < allDocuments.length; i++) {
                  if (i + 1 >= allDocuments.length) {
                    break;
                  }
                  const similar = similarity(
                    allDocuments[i].bytecode,
                    FoundCode
                  );
                  if (similar > highestSimilarity) {
                    highestSimilarity = similar;
                    highestSimilarityContract = allDocuments[i].contract;
                  } else {
                    highestSimilarity = highestSimilarity;
                  }
                }
                if (highestSimilarity >= 0.5) {
                  potential_scam = true;
                } else {
                  potential_scam = false;
                }
                try {
                  await client.connect();
                  const database = client.db("ERC20PnL");
                  const byteCodeScanResults = database.collection(
                    "byteCodeScanResults"
                  );

                  const newDocument = {
                    "Token:": createdAddress,
                    "Deployer:": deployer,
                    "Similarity %": highestSimilarity,
                    "Similarity To": highestSimilarityContract,
                    "Potential Scam:": potential_scam,
                  };
                  const insertResult = await byteCodeScanResults.insertOne(
                    newDocument
                  );
                  if (insertResult.insertedId) {
                    console.log(
                      `Success: Latest message from ${createdAddress} written to byteCodeScanResults with new _id: ${
                        insertResult.insertedId
                      }.`
                    );
                  } else {
                    console.log(
                      `Failed to write message from ${createdAddress} to byteCodeScanResults.`
                    );
                  }
                } catch (error) {
                  console.error("An error occurred:", error);
                }
              }//end if
            }
          } catch (error) {
            console.error("Error inside while loop", error);
          }
        }
      } catch (error) {
        console.error("Error inside current block listener", error);
      }
    });
  } catch (error) {
    console.error("Error in provider listening", error);
  }
};

// TokenScanScript();



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});