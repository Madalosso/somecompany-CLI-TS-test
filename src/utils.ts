import { ethers, isAddress } from "ethers";
type MatchingParameter<T> = undefined | "*" | T | T[];

// Function to encode address filters
export function encodeSenderAddress(senderAddress: MatchingParameter<string>): null | string | string[] {
  if (senderAddress === "*" || senderAddress === undefined) {
    return null;
  } else if (typeof senderAddress === "string") {
    const address = ethers.getAddress(senderAddress);
    return address;
  } else if (Array.isArray(senderAddress)) {
    return senderAddress.map((addr) => {
      const address = ethers.getAddress(addr);
      return address;
    });
  } else {
    throw new Error("Invalid senderAddress");
  }
}
// Function to encode destinationDomain
export function encodeDestinationDomain(destinationDomain: MatchingParameter<number>): null | string | string[] {
  if (destinationDomain === "*" || destinationDomain === undefined) {
    return null;
  } else if (typeof destinationDomain === "number") {
    // Convert the number to a hex string and pad to 32 bytes
    return ethers.toBeHex(destinationDomain, 32);
  } else if (Array.isArray(destinationDomain)) {
    return destinationDomain.map((value) => ethers.toBeHex(value, 32));
  } else {
    throw new Error("Invalid destinationDomain");
  }
}

// Function to encode recipientAddress
export function encodeRecipientAddress(recipientAddress: MatchingParameter<string>): null | string | string[] {
  if (recipientAddress === "*" || recipientAddress === undefined) {
    return null;
  } else if (typeof recipientAddress === "string") {
    // Check if it's already a 32-byte hex string
    if (ethers.isHexString(recipientAddress, 32)) {
      return recipientAddress;
    } else {
      // Assume it's an address and pad to 32 bytes
      const address = ethers.getAddress(recipientAddress);
      return ethers.zeroPadValue(address, 32);
    }
  } else if (Array.isArray(recipientAddress)) {
    return recipientAddress.map((addr) => {
      if (ethers.isHexString(addr, 32)) {
        return addr;
      } else {
        const address = ethers.getAddress(addr);
        return ethers.zeroPadValue(address, 32);
      }
    });
  } else {
    throw new Error("Invalid recipientAddress");
  }
}

export function validateAddress(value: string) {
  if (!isAddress(value)) {
    throw new Error(`Invalid Ethereum address: ${value}`);
  }
  return value;
}

export function validateRpcUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol: RPC URL must use http or https.");
    }
    return value;
  } catch (err) {
    throw new Error(`Invalid RPC URL: ${value}`);
  }
}
