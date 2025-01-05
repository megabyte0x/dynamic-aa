import './App.css'
import { ConnectButton } from '@arweave-wallet-kit/react'
import { useActiveAddress } from '@arweave-wallet-kit/react';
import { aaSteps } from './components/mint';



function App() {

  const address = useActiveAddress();

  return (
    <>
      <ConnectButton/>
      <p>{address}</p>
      <button onClick={() => aaSteps(address)}>Mint</button>
    </>
  )
}

export default App
