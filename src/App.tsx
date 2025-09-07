import {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import type { ChannelFilters, ChannelOptions, ChannelSort, TextComposerMiddleware } from 'stream-chat';
import {
  Channel,
  Chat,
  ChatView,
  useCreateChatClient,
} from 'stream-chat-react';
import clsx from 'clsx';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { PeraWalletConnect } from '@perawallet/connect';

import data from '@emoji-mart/data';
import { init, SearchIndex } from 'emoji-mart';

import 'stream-chat-react/dist/css/v2/index.css';
import './styles/index.css';

import {
  ChannelInner,
  CreateChannel,
  MessagingSidebar,
  SendButton,
} from './components';

import { LandingPage, OnboardingPage, HandshakePage } from './pages';

import { useThemeContext } from './context';

import { useChecklist, useMobileView, useUpdateAppHeightOnResize } from './hooks';
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


const noop = () => null;

const EmojiPickerWithTheme = () => {
  const { theme } = useThemeContext();

  return <EmojiPicker pickerProps={{ theme }} />;
};

const ChatApp = (props: AppProps) => {
  const { apiKey, userToConnect, userToken, targetOrigin, channelListOptions } = props;
  const [isCreating, setIsCreating] = useState(false);

  const chatClient = useCreateChatClient({
    apiKey,
    userData: userToConnect,
    tokenOrProvider: userToken,
  });
  
  useEffect(() => {
    if (chatClient) {
      console.log('Chat client connected:', {
        userId: chatClient.userID,
        connectionState: chatClient.wsConnection?.state,
        isOnline: chatClient.wsConnection?.isOnline
      });
      
      chatClient.on('connection.changed', (event) => {
        console.log('Connection changed:', event);
      });
      
      chatClient.on('connection.recovered', () => {
        console.log('Connection recovered');
      });
      
      chatClient.on('connection.error', (error) => {
        console.error('Connection error:', error);
      });
    }
  }, [chatClient]);
  const toggleMobile = useMobileView();
  const { themeClassName } = useThemeContext();

  useChecklist(chatClient, targetOrigin);
  useUpdateAppHeightOnResize();

  useEffect(() => {
    if (!chatClient) return;

    chatClient.setMessageComposerSetupFunction(({ composer }) => {
      composer.textComposer.middlewareExecutor.insert({
        middleware: [
          createTextComposerEmojiMiddleware(SearchIndex) as TextComposerMiddleware,
        ],
        position: { before: 'stream-io/text-composer/mentions-middleware' },
        unique: true,
      });
      composer.updateConfig({
        linkPreviews: {enabled: true},
      });
    });
  }, [chatClient]);

  if (!chatClient) {
    return null; // render nothing until connection to the backend is established
  }

  return (
    <Chat client={chatClient} theme={clsx('messaging', themeClassName)}>
      <ChatView>
        {/* <ChatView.Selector /> */}
        <ChatView.Channels>
          <MessagingSidebar
            channelListOptions={channelListOptions}
            onClick={toggleMobile}
            onCreateChannel={() => {
              console.log('Create channel button clicked, isCreating:', !isCreating);
              setIsCreating(!isCreating);
            }}
            onPreviewSelect={() => setIsCreating(false)}
          />
          {isCreating ? (
            <div style={{ flex: 1, display: 'flex' }}>
              <CreateChannel toggleMobile={toggleMobile} onClose={() => setIsCreating(false)} />
            </div>
          ) : (
            <Channel
              SendButton={SendButton}
              TypingIndicator={noop}
              EmojiPicker={EmojiPickerWithTheme}
              emojiSearchIndex={SearchIndex}
            >
              <ChannelInner theme={themeClassName} toggleMobile={toggleMobile} />
            </Channel>
          )}
        </ChatView.Channels>
      </ChatView>
    </Chat>
  );
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
          });

<<<<<<< HEAD
        // Automatically authenticate with backend when wallet is connected
        // try {
        //   let authResponse;
        //   try {
        //     authResponse = await authService.login({
        //       wallet_address: accounts[0]
        //     });
        //   } catch (loginError) {
        //     // If login fails, try to register
        //     authResponse = await authService.register({
        //       wallet_address: accounts[0]
        //     });
        //   }

        //   // Set auth state
        //   setAuthState({
        //     isAuthenticated: true,
        //     hasCompletedOnboarding: true,
        //     user: {
        //       id: authResponse.user.id,
        //       name: authResponse.user.name,
        //       image: authResponse.user.profile_pic_url
        //     },
        //     token: authResponse.token,
        //     streamToken: authResponse.stream_token
        //   });

        //   // Navigate to chat automatically
        //   navigate('/chat');
        // } catch (error) {
        //   console.error('Auto-authentication failed:', error);
        // }
      }
    }).catch(error => {
      console.log('Wallet reconnect error:', error);
    });
  }, [navigate]);
=======
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

            // Navigate to chat on successful authentication
            navigate('/chat');
          } catch (error) {
            console.error('Auto-authentication failed:', error);
          }
        }
      }).catch(error => {
        console.log('Wallet reconnect error:', error);
      });
    }
  }, [authState.isAuthenticated, navigate]);
>>>>>>> 0622fbd93031bd2ad0a5c3703d086adae55efb0b

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
            <ChatApp 
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
            <HandshakePage />
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
