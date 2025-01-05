import './App.css'
import { ConnectButton } from '@arweave-wallet-kit/react'
import { useActiveAddress } from '@arweave-wallet-kit/react';
import { aaSteps } from './components/mint';
import { useState } from 'react';

function App() {
  const address = useActiveAddress();
  const [processId, setProcessId] = useState(null);

  return (
    <div className="container dark">
      <div className="content-wrapper">
        <div className="inner-content">
          <h1 className="title">
            Mint your first Dynamic <span className="highlight">Atomic Asset</span>
          </h1>
          
          

          <div className="action-section">
            <ConnectButton />
            <p className="subtitle">
            {address ? "Click to mint." : "Connect wallet to Mint"}
          </p>
            {address && (
              <button 
                className="mint-button"
                onClick={async () => {
                  const result = await aaSteps(address);
                  if (result.success) {
                      setProcessId(result.processId);
                      console.log(`Process ${result.processId} completed: ${result.message}`);
                  } else {
                      console.log(`Error: ${result.message}`);
                  }
                }}
              >
                Mint NFT
              </button>
            )}

            {processId && (
              <div className="process-info">
                <p>Successfully minted! View on Bazar:</p>
                <a 
                  href={`https://bazar.arweave.net/#/asset/${processId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bazar-link"
                >
                  {processId.slice(0, 6)}...{processId.slice(-4)}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="footer">
        Proof of Build! by <a href="https://megabyte.ar.io" target="_blank" rel="noopener noreferrer">megabyte💫</a>
      </div>
    </div>
  )
}
export default App