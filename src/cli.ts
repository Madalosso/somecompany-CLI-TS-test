import { program } from "commander";
import { ethers, isAddress } from "ethers";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import * as path from "path";
import { mailboxAbi } from "./mailbox";
import { MatchingListElement } from "./types";
import {
  encodeDestinationDomain,
  encodeRecipientAddress,
  encodeSenderAddress,
  validateAddress,
  validateRpcUrl,
} from "./utils";

program.version("0.1.0").description("CLI to interact with Hyperlane Mailbox contracts");

// Load env vars from .env
dotenv.config();

function getProvider(rpcUrl: string): ethers.JsonRpcProvider {
  try {
    return new ethers.JsonRpcProvider(rpcUrl);
  } catch (error) {
    console.error("Error: Invalid RPC URL.");
    throw error;
  }
}

function getWallet(provider: ethers.JsonRpcProvider): ethers.Wallet {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("Private key not found in environment variables.");
  }
  try {
    return new ethers.Wallet(pk, provider);
  } catch (error) {
    console.error("Error creating wallet with the provided private key.");
    throw error;
  }
}

function getMailboxContract(
  mailboxAddress: string,
  walletOrProvider: ethers.Wallet | ethers.JsonRpcProvider
): ethers.Contract {
  try {
    return new ethers.Contract(mailboxAddress, mailboxAbi, walletOrProvider);
  } catch (error) {
    console.error("Error creating mailbox contract instance.");
    throw error;
  }
}

/** Helper function to read and parse the matching list JSON file */
function readMatchingList(jsonPath: string): MatchingListElement {
  try {
    const matchingListPath = path.resolve(jsonPath);
    const matchingListContent = readFileSync(matchingListPath, "utf8");
    return JSON.parse(matchingListContent);
  } catch (error) {
    console.error("Error reading or parsing the matching list JSON file.");
    throw error;
  }
}

program.command("wallet").action(async () => {
  const { Wallet } = require("ethers");
  const wallet = Wallet.createRandom();
  console.log(`Address: ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
});

// Improvement: Considering support PRIVATE_KEY as both .env and CLI argument (CLI required if .env not present)
// Improvement: Consider checking for .env var RPC_URL_<ChainSourceID> if no RPC_URL option provided by cli
program
  .command("send")
  .description("Send a message through Hyperlane Mailbox")
  .requiredOption("-m, --message <message>", "Message to send")
  .requiredOption("-mb, --mailbox <mailboxAddress>", "Mailbox address to send message to", validateAddress)
  .requiredOption("-r, --rpc <rpc>", "RPC URL to connect to", validateRpcUrl)
  .requiredOption("-d, --destinationChainId <destination chain>", "Destination chain")
  .requiredOption("-t, --destinationAddress <destination Address>", "Destination address", validateAddress)
  .action(async (options) => {
    console.log(`Sending message: ${options.message}`);

    try {
      const provider = getProvider(options.rpc);
      const wallet = getWallet(provider);
      const mailboxContract = getMailboxContract(options.mailbox, wallet);

      const messageBytes = ethers.toUtf8Bytes(options.message);

      // Validate destination address
      const cleanAddress = ethers.getAddress(options.destinationAddress);
      const bytes32Address = ethers.zeroPadValue(cleanAddress, 32);

      // what are the possible outputs that should stop the process?
      const dispatchFee = await mailboxContract.quoteDispatch(options.destinationChainId, bytes32Address, messageBytes);
      console.log(`Required protocol fee: ${ethers.formatEther(dispatchFee)} ETH`);

      // try catch block
      // Handle exception: Insufficient funds
      const dispatchTx = await mailboxContract.dispatch(options.destinationChainId, bytes32Address, messageBytes, {
        value: dispatchFee,
      });
      console.log("Transaction Hash: ", dispatchTx.hash, ". Waiting for confirmation...");

      // consider adding a wait for X confirmations depending on chain destination finality
      await dispatchTx.wait();
      console.log("Confirmed!");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  });

program
  .command("search")
  .description("Search for messages in Hyperlane Mailbox")
  .requiredOption("-mb, --mailbox <mailboxAddress>", "Mailbox contract address", validateAddress)
  .requiredOption("-r, --rpc <url>", "RPC URL of the chain", validateRpcUrl)
  .requiredOption("-j, --jsonPath <path>", "Path to JSON file containing MatchingList")
  .action(async (options) => {
    // NOTE: When querying events from an RPC, obviously, only the node chain will be queried,
    // so if RPC_URL flag is to be used, the parameter matchingList value for originDomain
    // won't take effect.
    // In order to originDomain to take effect, the RPC_URL flag should be removed and the
    // program should have another source of RPC URL based on the originDomain value.
    // (Something like RPC_URL_<originDomain> in the .env file)
    // If such a feature is implemented, every thing below should be instantiated according to each
    // chain, and preferably executed in parallel to save time.
    console.log(options);

    try {
      const provider = getProvider(options.rpc);
      const latestBlock = await provider.getBlockNumber();

      const contract = getMailboxContract(options.mailbox, provider);

      const matchingList = readMatchingList(options.jsonPath);

      console.log("MatchingList: ", matchingList);

      const eventSender = encodeSenderAddress(matchingList.senderAddress);
      console.info("eventSender: ", eventSender);
      const eventRecipient = encodeRecipientAddress(matchingList.recipientAddress);
      console.info("eventRecipient: ", eventRecipient);
      const eventDestination = encodeDestinationDomain(matchingList.destinationDomain);
      console.info("eventDestination: ", eventDestination);

      const dispatchEvent = contract.filters.Dispatch(eventSender, eventDestination, eventRecipient);
      const topicFilter = await dispatchEvent.getTopicFilter();

      // Determine the block range
      // Improvement: Set block deep to env var or flag
      const startBlock = Math.max(latestBlock - 1_000_000, 0);

      // This might vary according to the RPC capacity
      const chunkSize =
        Number(process.env.QUERY_BLOCKS_CHUNK_SIZE) > 0 ? Number(process.env.QUERY_BLOCKS_CHUNK_SIZE) : 10_000;

      let logs: ethers.Log[] = [];
      console.log("Searching for messages...");

      // Improvement: trigger execution of N concurrent queries
      for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += chunkSize + 1) {
        const toBlock = Math.min(fromBlock + chunkSize, latestBlock);
        console.log(`Querying logs from block ${fromBlock} to ${toBlock}...`);

        const filter: ethers.Filter = {
          address: options.mailbox,
          fromBlock,
          toBlock,
          topics: topicFilter,
        };

        try {
          const chunkLogs = await provider.getLogs(filter);
          console.log(`Found ${chunkLogs.length} logs in this chunk.`);
          logs = logs.concat(chunkLogs);
        } catch (error) {
          console.error(`Error fetching logs from block ${fromBlock} to ${toBlock}:`, error);
        }
      }
      console.log(`Found total of  ${logs.length} logs in this chunk.`);
      displayLogs(logs);
    } catch (error) {
      console.error("An error occurred while searching for messages: ", error);
    }
  });

function displayLogs(logs: ethers.Log[]) {
  // Improvement: Add link support for transactionHash/BlockNumber/sender/Recipient values to etherscan
  console.table(
    logs.map((log) => {
      return {
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        sender: log.topics[1],
        destination: ethers.toNumber(log.topics[2]),
        recipient: log.topics[3],
      };
    })
  );
}

program.parse(process.argv);
