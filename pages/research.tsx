import { useState, useEffect } from "react";
import { networks } from "../utils/networks";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { useCeramicContext } from "../context";
import Link from "next/link";
import { EASContractAddress, getAddressForENS } from "../utils/utils";
import { authenticateCeramic } from "../utils";

const eas = new EAS(EASContractAddress);

export default function Home() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");
  const [ensResolvedAddress, setEnsResolvedAddress] = useState("Dakh.eth");
  const [attesting, setAttesting] = useState(false);
  const [network, setNetwork] = useState("");
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;

  const handleLogin = async () => {
    const accounts = await authenticateCeramic(ceramic, composeClient);
    return accounts;
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }
      const accounts = await handleLogin();
      console.log("Connected", accounts[0]);
      setAccount(accounts[0].toLowerCase());
      setStatus("connected");
    } catch (error) {
      console.log(error);
    }
  };

  const handleChainChanged = (_chainId: string) => {
    window.location.reload();
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });
    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const acc = accounts[0];
      console.log("Found an authorized account:", acc);
      setAccount(acc.toLowerCase());
      setStatus("connected");
    } else {
      if (localStorage.getItem("did")) {
        localStorage.removeItem("did");
      }
      console.log("No authorized account found");
    }

    const chainId: string = await ethereum.request({ method: "eth_chainId" });

    // @ts-expect-error: Ignore the following line
    setNetwork(networks[chainId]);
    ethereum.on("chainChanged", handleChainChanged);
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }], // Check networks.js for hexadecimal network ids
        });
      } catch (error: any) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "11155111",
                  chainName: "Sepolia Test Network",
                  rpcUrls: ["https://eth-sepolia-public.unifra.io"],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "SepoliaETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="Container">
      {account && (
        <div className="right">
          <img alt="Network logo" className="logo" src={"/ethlogo.png"} />
          {account.length ? (
            <p style={{ textAlign: "center" }}>
              {" "}
              Connected with: {account.slice(0, 6)}...{account.slice(-4)}{" "}
            </p>
          ) : (
            <p style={{ textAlign: "center" }}> Not connected </p>
          )}
        </div>
      )}

      <div className="GradientBar" />
      <div className="WhiteBox">
        <div className="Title">
          I <b>attest</b> that I met
        </div>

        <div className="InputContainer">
          <input
            className="InputBlock"
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"Address/ENS"}
            value={address}
            onChange={(e) => setAddress(e.target.value.toLowerCase())}
          />
          {ensResolvedAddress && (
            <img className="EnsLogo" src={"/ens-logo.png"} />
          )}
        </div>
        {status !== "connected" ? (
          <button className="MetButton" onClick={async () => connectWallet()}>
            Connect Wallet
          </button>
        ) : network !== "Sepolia" ? (
          <button className="MetButton" onClick={async () => switchNetwork()}>
            Click here to switch to Sepolia
          </button>
        ) : (
          <button
            className="MetButton"
            onClick={async () => {
              if (status !== "connected") {
                connectWallet();
              } else {
                setAttesting(true);
                try {
                  const provider = new ethers.providers.Web3Provider(
                    window.ethereum as unknown as ethers.providers.ExternalProvider
                  );
                  const signer = provider.getSigner();

                  eas.connect(signer);

                  const schemaEncoder = new SchemaEncoder("bool metIRL");
                  const encoded = schemaEncoder.encodeData([
                    { name: "metIRL", type: "bool", value: true },
                  ]);
                  const recipient = (await address.includes(".eth"))
                    ? await getAddressForENS(address)
                    : address;

                  if (!recipient) {
                    alert("Incorrect recipient address");
                    return;
                  }
                  const offchain = await eas.getOffchain();

                  const time = Math.floor(Date.now() / 1000);
                  const offchainAttestation =
                    await offchain.signOffchainAttestation(
                      {
                        recipient: recipient.toLowerCase(),
                        // Unix timestamp of when attestation expires. (0 for no expiration)
                        expirationTime: 0,
                        // Unix timestamp of current time
                        time,
                        revocable: true,
                        version: 1,
                        nonce: 0,
                        schema:
                          "0xc59265615401143689cbfe73046a922c975c99d97e4c248070435b1104b2dea7",
                        refUID:
                          "0x0000000000000000000000000000000000000000000000000000000000000000",
                        data: encoded,
                      },
                      signer
                    );
                  // un-comment the below to process an on-chain timestamp
                  // const transaction = await eas.timestamp(offchainAttestation.uid);
                  // // Optional: Wait for the transaction to be validated
                  // await transaction.wait();
                  const userAddress = await signer.getAddress();
                  console.log(offchainAttestation);
                  const requestBody = {
                    ...offchainAttestation,
                    account: userAddress.toLowerCase(),
                  };
                  const data: any = await composeClient.executeQuery(`
                    mutation {
                      createAttestation(input: {
                        content: {
                          uid: "${requestBody.uid}"
                          schema: "${requestBody.message.schema}"
                          attester: "${account}"
                          verifyingContract: "${requestBody.domain.verifyingContract}"
                          easVersion: "${requestBody.domain.version}"
                          version: ${requestBody.message.version}
                          chainId: ${requestBody.domain.chainId}
                          r: "${requestBody.signature.r}"
                          s: "${requestBody.signature.s}"
                          v: ${requestBody.signature.v}
                          types: ${JSON.stringify(requestBody.types.Attest)
                            .replaceAll('"name"', "name")
                            .replaceAll('"type"', "type")}
                          recipient: "${requestBody.message.recipient}"
                          refUID: "${requestBody.message.refUID}"
                          data: "${requestBody.message.data}"
                          time: ${requestBody.message.time}
                        }
                      }) 
                      {
                        document {
                          id
                          uid
                          schema
                          attester
                          verifyingContract 
                          easVersion
                          version 
                          chainId 
                          types{
                            name
                            type
                          }
                          r
                          s
                          v
                          recipient
                          refUID
                          data
                          time
                        }
                      }
                    }
                  `);
                  console.log(data)
                  setAddress("");
                  setAttesting(false);
                } catch (e) {}
                setAddress("");
                setAttesting(false);
              }
            }}
          >
            {attesting
              ? "Attesting..."
              : status === "connected"
              ? "Make Offchain attestation"
              : "Connect wallet"}
          </button>
        )}

        {status === "connected" && (
          <>
            <div className="SubText">
              {" "}
              <Link href="/qr">Show my QR code</Link>
            </div>
            <div className="SubText">
              {" "}
              <Link href="/connections">Connections</Link>
            </div>
            <div className="SubText">
              {" "}
              <Link href="/verify">Verify Attestations</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}