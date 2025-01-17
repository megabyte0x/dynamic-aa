import './App.css'
import { ConnectButton } from '@arweave-wallet-kit/react'
import { useActiveAddress } from '@arweave-wallet-kit/react';
import { aaSteps } from './components/mint';
import { useState } from 'react';
import clickSound from './assets/click-sound.mp3';

function App() {
  const address = useActiveAddress();
  const [processId, setProcessId] = useState(null);
  const [loading, setLoading] = useState(false);

  const playSound = () => {
    const audio = new Audio(clickSound);
    audio.play().catch(error => console.error('Error playing sound:', error));
  };

  return (
    <div className="container dark">
      <div className="content-wrapper">
        <div className="inner-content">
          <h1 className="title">
            Mint your first Dynamic <span className="highlight">Atomic Asset</span>
          </h1>
          <div className="action-section">
            <ConnectButton onClick={playSound} />
            <p className="subtitle">
            {address ? "Click to mint." : "Connect wallet to Mint"}
          </p>
            {address && (
              <button 
                className="mint-button"
                onClick={async () => {
                  playSound();
                  setLoading(true);
                  const result = await aaSteps(address);
                  setLoading(false);
                  if (result.success) {
                      setProcessId(result.processId);
                      console.log(`Process ${result.processId} completed: ${result.message}`);
                  } else {
                      console.log(`Error: ${result.message}`);
                  }
                }}
                disabled={loading}
              >
                {loading ? "Minting..." : "Mint NFT"}
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
                  onClick={playSound} 
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