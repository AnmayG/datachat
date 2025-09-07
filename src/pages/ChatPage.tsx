import {useEffect, useState} from 'react';
import type { ChannelFilters, ChannelOptions, ChannelSort, TextComposerMiddleware } from 'stream-chat';
import {
  Channel,
  Chat,
  ChatView,
  useCreateChatClient,
} from 'stream-chat-react';
import clsx from 'clsx';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';

import { SearchIndex } from 'emoji-mart';

import 'stream-chat-react/dist/css/v2/index.css';
import '../styles/index.css';

import {
  ChannelInner,
  CreateChannel,
  MessagingSidebar,
  SendButton,
} from '../components';

import { useThemeContext } from '../context';

import { useChecklist, useMobileView, useUpdateAppHeightOnResize } from '../hooks';

type ChatPageProps = {
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

const ChatPage = (props: ChatPageProps) => {
  const { apiKey, userToConnect, userToken, targetOrigin, channelListOptions } = props;
  const [isCreating, setIsCreating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showChannelView, setShowChannelView] = useState(false);

  const chatClient = useCreateChatClient({
    apiKey,
    userData: userToConnect,
    tokenOrProvider: userToken,
  });
  
  useEffect(() => {
    if (chatClient) {
      console.log('Chat client connected:', {
        userId: chatClient.userID,
        wsConnection: !!chatClient.wsConnection
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

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    return null;
  }

  // Mobile view: show sidebar by default, channel view when selected
  if (isMobile) {
    return (
      <Chat client={chatClient} theme={clsx('messaging', themeClassName)}>
        <ChatView>
          <ChatView.Channels>
            {/* Show create channel modal as overlay on mobile */}
            {isCreating ? (
              <div className="mobile-create-channel-overlay">
                <CreateChannel 
                  toggleMobile={() => setIsCreating(false)} 
                  onClose={() => setIsCreating(false)} 
                />
              </div>
            ) : showChannelView ? (
              <Channel
                SendButton={SendButton}
                TypingIndicator={noop}
                EmojiPicker={EmojiPickerWithTheme}
                emojiSearchIndex={SearchIndex}
              >
                <ChannelInner 
                  theme={themeClassName} 
                  toggleMobile={() => setShowChannelView(false)} 
                />
              </Channel>
            ) : (
              <MessagingSidebar
                channelListOptions={channelListOptions}
                onClick={() => {}}
                onCreateChannel={() => {
                  console.log('Create channel button clicked');
                  setIsCreating(true);
                }}
                onPreviewSelect={() => setShowChannelView(true)}
              />
            )}
          </ChatView.Channels>
        </ChatView>
      </Chat>
    );
  }

  // Desktop view: show sidebar and channel side by side
  return (
    <Chat client={chatClient} theme={clsx('messaging', themeClassName)}>
      <ChatView>
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

export default ChatPage;