import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import { useThemeContext } from '../context';
import { PeraWalletConnect } from '@perawallet/connect';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLogin?: (userInfo: { id: string; name: string; image?: string; token?: string; streamToken?: string }) => void;
}

// Create the PeraWalletConnect instance outside of the component
const peraWallet = new PeraWalletConnect({
  chainId: 416002 // TestNet
});

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { themeClassName } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const isConnectedToPeraWallet = !!accountAddress;


  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet.reconnectSession().then(async (accounts) => {
      // Setup the disconnect event listener
      peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

      if (accounts.length) {
        setAccountAddress(accounts[0]);
        
        try {
          // Authenticate with backend
          await authenticateWithBackend(accounts[0]);
        } catch (authError) {
          console.error('Failed to authenticate on reconnect:', authError);
        }
      }
    }).catch(error => {
      console.log('Reconnect error:', error);
    });
  }, [onLogin]);

  const authenticateWithBackend = async (walletAddress: string) => {
    setAuthLoading(true);
    try {
      // Try to login first
      let authResponse;
      try {
        authResponse = await authService.login({
          wallet_address: walletAddress
        });
        console.log('Login successful:', authResponse);
      } catch (loginError) {
        console.log('Login failed, attempting registration:', loginError);
        // If login fails, try to register
        authResponse = await authService.register({
          wallet_address: walletAddress
        });
        console.log('Registration successful:', authResponse);
      }

      // Call onLogin with all the authentication data (stream token is already included in authResponse)
      if (onLogin) {
        console.log('Calling onLogin with backend authentication data');
        onLogin({
          id: authResponse.user.id,
          name: authResponse.user.name,
          image: undefined,
          token: authResponse.token,
          streamToken: authResponse.stream_token
        });
      }

      return authResponse;
    } catch (error) {
      console.error('Backend authentication failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConnectWalletClick = () => {
    setLoading(true);
    peraWallet
      .connect()
      .then(async (newAccounts) => {
        // Setup the disconnect event listener
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

        setAccountAddress(newAccounts[0]);
        
        try {
          // Authenticate with backend
          await authenticateWithBackend(newAccounts[0]);
        } catch (authError) {
          console.error('Backend authentication failed:', authError);
          // You could show an error message to the user here
        }
      })
      .catch((error) => {
        // Handle the reject because once the user closes the modal, peraWallet.connect() promise will be rejected
        if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
          console.error('Wallet connection error:', error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDisconnectWalletClick = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
  };


  return (
    <div className={`str-chat login-page ${themeClassName}`}>
      <div className="login-container">
        <div className="login-card">
          <header className="login-header">
            <div className="logo">
              <span className="brand-icon">🤝</span>
              <h1>DataChat</h1>
            </div>
            <h2>Connect Your Wallet</h2>
            <p>Connect your Pera Wallet to get started</p>
            {isConnectedToPeraWallet && (
              <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px', fontSize: '14px'}}>
                Connected to Pera Wallet: {accountAddress?.substring(0, 8)}...{accountAddress?.substring(accountAddress.length - 8)}
              </div>
            )}
          </header>

          <div className="wallet-connection">
            <button 
              type="button" 
              className="btn btn-primary btn-full"
              onClick={isConnectedToPeraWallet ? handleDisconnectWalletClick : handleConnectWalletClick}
              disabled={loading || authLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loading ? 'Connecting...' : authLoading ? 'Authenticating...' : (isConnectedToPeraWallet ? 'Disconnect Pera Wallet' : 'Connect with Pera Wallet')}
            </button>
          </div>

          <footer className="login-footer">
            <div className="login-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;