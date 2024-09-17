export interface MatchingListElement {
  originDomain?: "*" | number | number[];
  senderAddress?: "*" | string | string[];
  destinationDomain?: "*" | number | number[];
  recipientAddress?: "*" | string | string[];
}
