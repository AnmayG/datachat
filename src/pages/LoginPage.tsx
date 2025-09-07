import React, { useState } from 'react';
import './LoginPage.css';
import { useThemeContext } from '../context';
import type { PeraWalletConnect } from '@perawallet/connect';
import { authService } from '../services/authService';
import type { UserInfo } from '../types/auth';

interface LoginPageProps {
  onLogin?: (userInfo: UserInfo) => void;
  connectedWallet: string | null;
  peraWallet: PeraWalletConnect;
  setConnectedWallet: (wallet: string | null) => void;
  onClose?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, connectedWallet, peraWallet, setConnectedWallet, onClose }) => {
  const { themeClassName } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const isConnectedToPeraWallet = !!connectedWallet;


  const authenticateWithBackend = React.useCallback(async (walletAddress: string) => {
    setAuthLoading(true);
    try {
      // Try to login first
      let authResponse;
      try {
        authResponse = await authService.login({
          wallet_address: walletAddress
        });
      } catch (loginError) {
        // If login fails, try to register
        authResponse = await authService.register({
          wallet_address: walletAddress
        });
      }

      return authResponse;
    } catch (error) {
      console.error('Backend authentication failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [onLogin]);


  const handleConnectWalletClick = () => {
    setLoading(true);
    peraWallet
      .connect()
      .then(async (newAccounts) => {
        // Setup the disconnect event listener
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

        setConnectedWallet(newAccounts[0]);
        
        try {
          // Authenticate with backend
          const authResponse = await authenticateWithBackend(newAccounts[0]);
          
          // Call onLogin with the authentication data
          if (onLogin) {
            onLogin({
              id: authResponse.user.id,
              name: authResponse.user.name,
              image: undefined,
              token: authResponse.token,
              streamToken: authResponse.stream_token
            });
          }
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
    setConnectedWallet(null);
  };


  return (
    <div className={`str-chat login-page ${themeClassName}`}>
      <div className="login-container">
        <div className="login-card">
          <header className="login-header">
            <div className="modal-header-row">
              <div className="logo">
                <h1>ShakeOnIt</h1>
              </div>
              {onClose && (
                <button
                  className="modal-close"
                  onClick={onClose}
                  style={{ color: 'white' }}
                >
                  ×
                </button>
              )}
            </div>
            <h2 className="modal-title">Connect Your Wallet</h2>
            <p>Connect your Pera Wallet to get started</p>
            {isConnectedToPeraWallet && (
              <div style={{marginTop: '10px', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)'}}>
                Connected to Pera Wallet: {connectedWallet?.substring(0, 8)}...{connectedWallet?.substring(connectedWallet.length - 8)}
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.6-.35 1-.98 1-1.72V9c0-.74-.4-1.38-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2H9c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h10v2H5z" />
                <circle cx="16" cy="12" r="1.5" />
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