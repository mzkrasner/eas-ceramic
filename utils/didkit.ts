// Import the module
import DIDKit from'@spruceid/didkit-wasm-node';

console.log(DIDKit.getVersion());

// To issue credentials and presentations, you need a key.
// The library provides a function to generate one.
const key = DIDKit.generateEd25519Key();

// There are two helpful functions to obtain a DID and the `did:key`
// `verificationMethod` from the key.
const did = DIDKit.keyToDID('key', key);
const verificationMethod = DIDKit.keyToVerificationMethod('key', key);