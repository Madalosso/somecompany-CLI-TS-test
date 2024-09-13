import { program } from "commander";
import { ethers } from "ethers";

program.version("0.1.0").description("CLI to interact with Hyperlane Mailbox contracts");

// TODO: weight on which flags are optional and required
// allow for a .env setup for things like RPC+mailbox
// we can have a map between chainId and chain configs

// Note: How to handle msg as bytes?
// TODO: Add options to package.json scripts test-run
program
  .command("send")
  .description("Send a message through Hyperlane Mailbox")
  .requiredOption("-m, --message <message>", "Message to send")
  .requiredOption("-s, --sourceChain <srcChain>", "Chain to send message from")
  .requiredOption("-m, --mailbox <mailboxAddress>", "Mailbox address to send message to")
  .requiredOption("-r, --rpc <rpc>", "RPC URL to connect to")
  .requiredOption("-d, --destinationChain <outChain>", "Destination chain")
  .requiredOption("-t, --to <destinationAddress>", "Destination address")
  .action(async (options) => {
    console.log(`Sending message: ${options.message}`);

    // TODO: Check if this is a https/ws url. Maybe support both?
    // Maybe validate before?
    const provider = new ethers.JsonRpcProvider(options.rpc);

    // TODO: Hide secret key. Probably should read it from .env
    // const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const wallet = new ethers.Wallet("<Add pk>", provider);

    const mailboxContract = new ethers.Contract(
      options.mailboxAddress,
      ["function dispatch(uint32,bytes32,bytes)"], // Double check this ABI definition
      wallet
    );

    // Sanitize message

    // call async function to send message
    // await for confirmation (Pool for tx receipt)

    // Add ethers.js logic to send a message via contract here
  });

program
  .command("search")
  .description("Search for messages in Hyperlane Mailbox")
  .action(() => {
    console.log("Searching for messages...");
  });

program.parse(process.argv);
