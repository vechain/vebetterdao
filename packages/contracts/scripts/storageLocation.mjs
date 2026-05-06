import { AbiCoder, keccak256, toBeHex, toUtf8Bytes } from "ethers";

const input = process.argv.slice(2).join(" ").trim();

if (!input) {
  console.error('Usage: yarn storage-location "b3tr.storage.Challenges"');
  process.exit(1);
}

const namespace = input.startsWith("erc7201:") ? input.slice("erc7201:".length) : input;
const namespaceHash = BigInt(keccak256(toUtf8Bytes(namespace)));
const encoded = AbiCoder.defaultAbiCoder().encode(["uint256"], [namespaceHash - 1n]);
const storageLocation =
  BigInt(keccak256(encoded)) & (~0xffn & ((1n << 256n) - 1n));

console.log(`Namespace: ${namespace}`);
console.log(`Storage location: ${toBeHex(storageLocation, 32)}`);
