import { program } from "commander";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import * as path from "path";
// TODO: uncomment overloaded dispatch signatures
// support extra args for dispatch
import { mailboxAbi } from "./mailbox";

// read from cli args
const rpc = "https://ethereum-sepolia-rpc.publicnode.com";
const sourceChainId = 11155111;
const destinationChainId = 421614;
const mailboxAddress = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766";
const destinationAddress = "0xd0e3bd9fdfC791ddE8aa45c6227f9310D07A9C80";

program.version("0.1.0").description("CLI to interact with Hyperlane Mailbox contracts");

// Load env vars from .env
dotenv.config();

// Improvement: Considering support PRIVATE_KEY as both .env and CLI argument (CLI required if .env not present)
// Improvement: Consider checking for .env var RPC_URL_<ChainSourceID> if no RPC_URL option provided by cli

program
  .command("send")
  .description("Send a message through Hyperlane Mailbox")
  .requiredOption("-m, --message <message>", "Message to send")
  // .requiredOption("-s, --sourceChainId <srcChain>", "Chain to send message from")
  // .requiredOption("-mb, --mailbox <mailboxAddress>", "Mailbox address to send message to")
  // .requiredOption("-r, --rpc <rpc>", "RPC URL to connect to")
  // .requiredOption("-d, --destinationChainId <outChain>", "Destination chain")
  // .requiredOption("-t, --destinationAddress <destinationAddress>", "Destination address")
  .action(async (options) => {
    console.log(`Sending message: ${options.message}`);

    // validate inputs (check if commander custom validators are available)
    // 1) Check if sourceChain is a valid chainId
    // 2) Check if mailbox is a valid address
    // 3) Check if rpc is a valid URL
    // 4) Check if destinationChain is a valid chainId
    // 5) Check if destinationAddress is a valid address
    // TODO: Check if this is a https/ws url. Maybe support both?
    // Maybe validate before?

    const provider = new ethers.JsonRpcProvider(rpc);

    // TODO: remove as string -> validate instead
    const pk = process.env.PRIVATE_KEY || "";
    const wallet = new ethers.Wallet(pk, provider);

    const mailboxContract = new ethers.Contract(mailboxAddress, mailboxAbi, wallet);

    console.log("message: ", options.message);
    // Sanitize message
    const messageBytes = ethers.toUtf8Bytes(options.message);
    console.log("messageBytes: ", messageBytes);

    // Validate destination address
    const cleanAddress = ethers.getAddress(destinationAddress);
    const bytes32Address = ethers.zeroPadValue(cleanAddress, 32);

    const dispatchFee = await mailboxContract.quoteDispatch(destinationChainId, bytes32Address, messageBytes);
    console.log(`Required protocol fee: ${ethers.formatEther(dispatchFee)} ETH`);

    // try catch block

    // Handle exception: Insufficient funds
    const dispatchTx = await mailboxContract.dispatch(destinationChainId, bytes32Address, messageBytes, {
      value: dispatchFee,
    });
    console.log("Transaction Hash: ", dispatchTx.hash, " Waiting for confirmation...");

    // consider adding a wait for X confirmations depending on chain destination finality
    await dispatchTx.wait();
    console.log("Confirmed!");
  });

interface MatchingListElement {
  originDomain?: "*" | number | number[];
  senderAddress?: "*" | string | string[];
  destinationDomain?: "*" | number | number[];
  recipientAddress?: "*" | string | string[];
}

//Load dynamically and validate
const filters: MatchingListElement = {
  senderAddress: "0xd0e3bd9fdfC791ddE8aa45c6227f9310D07A9C80",
  recipientAddress: "0xd0e3bd9fdfC791ddE8aa45c6227f9310D07A9C80",
  destinationDomain: 11155111,
  originDomain: 421614,
};

program
  .command("search")
  .description("Search for messages in Hyperlane Mailbox")
  .requiredOption("-c, --chain <chain>", "Chain RPC URL to search")
  .requiredOption("-m, --mailbox <address>", "Mailbox contract address")
  .requiredOption("-r, --rpc <url>", "RPC URL of the chain")
  .requiredOption("-j, --json <path>", "Path to JSON file containing MatchingList")
  .action(() => {
    console.log("Searching for messages...");

    const provider = new ethers.JsonRpcProvider(rpc);

    // const matchingListPath = path.resolve(program.option.jsonPath);
    // const matchingListContent = readFileSync(matchingListPath, "utf8");
    // const matchingList: MatchingListElement = JSON.parse(matchingListContent);
  });

program.parse(process.argv);
