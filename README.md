# Hyperlane Typescript Challenge

[Requirements/description](https://hyperlanexyz.notion.site/Typescript-Challenge-8eb08b9ae4664b7cb570becda0606825)

# TODO:

- Add/check missing instructions (push, clone and try)

## Test instructions/configs

Follow these command from the directory root.

1. Copy the content of `.env.example` to a `.env` file. (Adjust according to "Configuration" section)

2. `npm install`

3. `npm run build`.

4. Send command: `node dist/cli.js send -m "Hello, Hyperlane!"`

5. Search command: `dist/cli.js search --mailbox 0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766 -r https://ethereum-sepolia-rpc.publicnode.com -j test/matching.json`

## .env Configuration

- QUERY_BLOCKS_CHUNK_SIZE: The amount of blocks queried over each RPC get_logs request. (RPC capacity may vary). Defaults to 50_000

## Improvements

### Enhance UX

#### Output Display

In order to make it easier for CLI users to interact with the tool output, it would be nice to enable wrapper links on the `search` command output (table with transactionHash/BlockNumber/addresses) so the user can click and be directed to the block explorer. Same can be done for `send` command output (transactionHash).

#### Environment configs

Most of the parameters necessary to execute the commands are being captured through execution flags. This can be enhanced by defining expanding the usage of .env configs as default values, and overwriting such values if the flag parameters are provided in each call. That way the CLI usage verbosity will be reduced, enhancing the user experience

### Support `MatchingList.originDomain` field

In order to support fetching logs from multiple originDomain values, it will be necessary to have a map of chainIDs and RPC*URL providers. (Something like `RPC_URL*<originDomain>` in the .env file).

If such feature gets implemented, it will be necessary to repeat most of the `search` command routine for each originDomain value, so the providers, contracts, filters and 1M range block scan can be done according to each chain configuration.

To speed things up, this should be implemented using concurrency, so multiple routines can be triggered and executed "at the same time". (mind the quotes)

### Enhance performance

The current implementation loop over chunks of blocks (.env `QUERY_BLOCKS_CHUNK_SIZE`) in order to cover the desired 1_000_000 block range. For the default value of 50k blocks per request, it requires 20 iterations to query it all, which can take minutes to execute.

This can be enhanced by triggering multiple concurrent requests.

The same approach can/should be used when enabling the `originDomain` search.

## Known issues / Assumptions / Test Considerations

For the test purpose, I'm focusing on points that should display my skills and awareness over building a CLI tool, I'm not putting perfectionism over Hyperlane specifics characteristics. Here are a list of topics I want to disclose I'm choosing not to handle, but I'm aware I would have to address if this code was targeting production/real-world usage:

- Message validation. Obviously, there will be limits to the message length that this CLI should respect.

- This CLI only supports the `Dispatch(destinationDomain, recipientAddress, messageBody)` function. Not the same contract function name with other function signature (extra parameters)

- Granular debug/try-catch so it's easier to identify in which step something went wrong. For instance:

  - Calling mailbox.quoteDispatch
  - Calling mailbox.Dispatch

- I didn't wrote any unit tests, but they would be quite simple and effective against auxiliary functions that don't depend on external data (on-chain). It would be nice to add a test to assert the correct filter configurations out of multiple json files configs.

- Check private_key wallet balance and gracefully handle lack of funds to pay for protocol fees/gas

### ChainID <=> RPC_URL

Since a RPC_URL will point to a provider that will be connected to only one chain, I'm inferring that the origin chain/domain will always be aligned with the provider. That is, when using the `search` command, which requires an RPC_URL argument, the originDomain won't be taken into consideration.

> I've left a comment on the code proposing how to enable the `originDomain` field from MatchingListElement, but I've decided to not implement it for this submission.

The same approach is applied to the `send` command, the command doesn't require the "origin chain" parameter, as it's assumed that the RPC_URL + mailbox address are enough to send the message, as long as these value are valid.
