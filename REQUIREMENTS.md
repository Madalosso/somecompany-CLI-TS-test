# Typescript Challenge

# Background

Hyperlane is an interchain messaging protocol built on top of a modular security stack. Each Hyperlane deployment includes a [Mailbox](https://docs.hyperlane.xyz/docs/reference/messaging/messaging-interface) smart contract, which acts as the endpoint for sending and receiving interchain messages.

# Your mission

**Your mission is to implement a CLI tool for sending and querying messages.**

Specifically, the CLI should support the following commands:

1. **Send a message**: When provided with a origin chain, mailbox address, RPC URL, destination address/chain, and arbitrary message bytes, the tool should dispatch the message via Hyperlane. It should then poll for delivery of the message of the destination chain and indicate success to the user.
2. **Search for messages**: The CLI should allow users to query for any messages sent from a specified chain’s Mailbox by providing a [MatchingList](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/465112db6fddb3b598d6da39c13491ff1bc7e700/typescript/infra/src/config/agent/relayer.ts#L19) as JSON input. You should query the last one million blocks from the chain via the `eth_getLogs` rpc calls (you will need to chunk the window) to find matching `Dispatch` events.

**When you’re done implementing the CLI, please create a repo and share that with us.** Please do not create a PR on the actual hyperlane-monorepo.

We expect this challenge to take a few hours to complete, but feel free to spend as little or as much time as you like. As always, please do not hesitate to reach out if you have any questions or feedback.

# Requirements

- Use the Typescript programming language
- Utilize ethers or viem for ethereum RPC calls, do not use the Hyperlane explorer
- Set up and use a private key for Hyperlane messaging
- Display output in a user-friendly way
- Provide necessary instructions for testing your application
- MatchingList is a list of MatchingListElement, where each field is optional and should be treated as a wildcard
- Share the repo with Github users `nambrot`, `jmrossy`, `yorhodes`, `tkporter`, `cmcewen`, `ltyu`(please make your submission private)

# Resources

- [Hyperlane messaging API documentation](https://docs.hyperlane.xyz/docs/reference/messaging/messaging-interface)
- [MatchingList](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/465112db6fddb3b598d6da39c13491ff1bc7e700/typescript/infra/src/config/agent/relayer.ts#L19)
