import { useState, useEffect } from "react";
import { networks } from "../utils/networks";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { useCeramicContext } from "../context";
import Link from "next/link";
import { EASContractAddress } from "../utils/utils";
import { authenticateCeramic } from "../utils";

const eas = new EAS(EASContractAddress);

export default function Home() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");
  const [vetted, setIsVetted] = useState(false);
  const [researchCID, setResearchCID] = useState("");
  const [context, setContext] = useState("");
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
        <div className="Title">Research Object Attestation</div>

        <div className="InputContainer">
          <input
            className="InputBlock"
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"Research Object CID"}
            value={researchCID}
            onChange={(e) => setResearchCID(e.target.value)}
          />
        </div>
        <div className="InputContainer">
          <input
            className="InputBlock"
            autoCorrect={"off"}
            autoComplete={"off"}
            autoCapitalize={"off"}
            placeholder={"Context"}
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
        <label htmlFor="bool">Is Vetted Research Object?</label>
        <select
          id="bool"
          name="bool"
          value={vetted.toString()}
          onChange={(e) => setIsVetted(e.target.value === "true")}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
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

                 

                //   if (!vetted || !context || !researchCID) {
                //     alert("You are missing an input field");
                //     return;
                //   }
                  
                 
                  const userAddress = await signer.getAddress();

                
                  const test = await fetch(
                    "/api/vc"
                  )
                    .then((response) => response.json())
                    .then((data) => data);
                    console.log(test)
                //   setAttestations([]);

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
