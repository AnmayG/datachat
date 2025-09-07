import {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { PeraWalletConnect } from '@perawallet/connect';

import data from '@emoji-mart/data';
import { init } from 'emoji-mart';

import './styles/index.css';

import { LandingPage, OnboardingPage, HandshakePage, ChatPage } from './pages';


import { authService } from './services/authService';
import type { UserInfo, AuthState, OnboardingPreferences } from './types/auth';


init({ data });

// Create the PeraWalletConnect instance at app level
const peraWallet = new PeraWalletConnect({
  chainId: 416002 // TestNet
});

type AppProps = {
  apiKey: string;
  userToConnect: { id: string; name?: string; image?: string };
  userToken: string | undefined;
  targetOrigin: string;
  channelListOptions: {
    options: ChannelOptions;
    filters: ChannelFilters;
    sort: ChannelSort;
  };
};




const AppContent = (props: AppProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    user: null,
    token: undefined,
    streamToken: undefined
  });
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const navigate = useNavigate();

  // Reconnect to wallet session on app load and authenticate
  useEffect(() => {
    // Only run this effect if not already authenticated
    if (!authState.isAuthenticated) {
      peraWallet.reconnectSession().then(async (accounts) => {
        if (accounts.length) {
          setConnectedWallet(accounts[0]);
          // Setup disconnect listener
          peraWallet.connector?.on("disconnect", () => {
            setConnectedWallet(null);
            setAuthState({
              isAuthenticated: false,
              hasCompletedOnboarding: false,
              user: null,
              token: undefined,
              streamToken: undefined
            });
            navigate('/');
          });

          // Automatically authenticate with backend when wallet is connected
          try {
            let authResponse;
            try {
              authResponse = await authService.login({
                wallet_address: accounts[0]
              });
            } catch (loginError) {
              // If login fails, try to register
              authResponse = await authService.register({
                wallet_address: accounts[0]
              });
            }

            // Set auth state
            setAuthState({
              isAuthenticated: true,
              hasCompletedOnboarding: true,
              user: {
                id: authResponse.user.id,
                name: authResponse.user.name,
                image: authResponse.user.profile_pic_url
              },
              token: authResponse.token,
              streamToken: authResponse.stream_token
            });

            // Navigate to chat automatically
            navigate('/chat');
          } catch (error) {
            console.error('Auto-authentication failed:', error);
            // If auto-auth fails, stay on landing page for manual connection
          }
        }
      }).catch(error => {
        console.log('Wallet reconnect error:', error);
      });
    }
  }, [navigate, authState.isAuthenticated]);

  const handleLogin = (userInfo: UserInfo) => {
    setAuthState({
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      user: userInfo,
      token: userInfo.token,
      streamToken: userInfo.streamToken
    });
  };

  const handleOnboardingComplete = (userPreferences: OnboardingPreferences) => {
    setAuthState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      user: prev.user ? {
        ...prev.user,
        name: userPreferences.displayName,
        image: userPreferences.avatar
      } : null
    }));
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLogin={handleLogin} connectedWallet={connectedWallet} peraWallet={peraWallet} setConnectedWallet={setConnectedWallet} />} />
      <Route 
        path="/login" 
        element={
          authState.isAuthenticated ? 
            <Navigate to="/chat" replace /> : 
            <Navigate to="/" replace />
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          !authState.isAuthenticated ? 
            <Navigate to="/login" replace /> : 
            authState.hasCompletedOnboarding ? 
              <Navigate to="/chat" replace /> : 
              <OnboardingPage onComplete={handleOnboardingComplete} />
        } 
      />
      <Route 
        path="/chat" 
        element={
          !authState.isAuthenticated ? 
            <Navigate to="/login" replace /> : 
            <ChatPage 
              {...props}
              userToConnect={authState.user || props.userToConnect}
              userToken={authState.streamToken || props.userToken}
            />
        } 
      />
      <Route 
        path="/handshake" 
        element={
          !authState.isAuthenticated ? 
            <Navigate to="/login" replace /> : 
            <HandshakePage 
              user={authState.user} 
              peraWallet={peraWallet}
              connectedWallet={connectedWallet}
            />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = (props: AppProps) => {
  return (
    <Router>
      <AppContent {...props} />
    </Router>
  );
};

export default App;
