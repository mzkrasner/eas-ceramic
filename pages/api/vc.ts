import DIDKit from "@spruceid/didkit-wasm-node";
import { NextApiRequest, NextApiResponse } from "next";

export default async function createAttestation(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {

    console.log(DIDKit.getVersion());

    // To issue credentials and presentations, you need a key.
    // The library provides a function to generate one.
    const key = DIDKit.generateEd25519Key();
    
    // There are two helpful functions to obtain a DID and the `did:key`
    // `verificationMethod` from the key.
    const did = DIDKit.keyToDID('key', key);
    const verificationMethod = DIDKit.keyToVerificationMethod('key', key);

    const item = {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://beta.api.schemas.serto.id/v1/public/valid-research-object/2.0/ld-context.json"
        ],
        "credentialSchema": {
          "id": "https://beta.api.schemas.serto.id/v1/public/valid-research-object/2.0/json-schema.json",
          "type": "JsonSchemaValidator2018"
        },
        "type": [
          "VerifiableCredential",
          "ValidResearchObject"
        ],
        "issuer": "did:key:z6Mkqf4DouzLmGrh7eCsWBJWBeaA8bmSck8f4JpDEo498L4X",
        "issuanceDate": "2023-09-27T15:19:32.711Z",
        "credentialSubject": {
          "id": "w3ccred:credentialSubject",
          "cid": "b45165ed3cd437b9ffad02a2aad22a4ddc69162470e2622982889ce5826f6e3d",
          "isVettedResearchObject": true,
          "context": "This is my reasoning",
        }
      }

    // const vcToShare = await DIDKit.issueCredential(JSON.stringify(item), '', key)
    // console.log(vcToShare)

    return res.json({ did });



  } catch (err) {
    return res.json({ err });
  }
}

console.log(DIDKit.getVersion());

// To issue credentials and presentations, you need a key.
// The library provides a function to generate one.
const key = DIDKit.generateEd25519Key();
console.log(key);

// There are two helpful functions to obtain a DID and the `did:key`
// `verificationMethod` from the key.
const did = DIDKit.keyToDID("key", key);
console.log(did);
const verificationMethod = DIDKit.keyToVerificationMethod("key", key);
