import type { MouseEventHandler } from 'react';
import { ChannelList, ChannelListProps } from 'stream-chat-react';

import { MessagingChannelListHeader, MessagingChannelPreview } from '../index';
import { useThemeContext } from '../../context';

type MessagingSidebarProps = {
  channelListOptions: {
    filters: ChannelListProps['filters'];
    sort: ChannelListProps['sort'];
    options: ChannelListProps['options'];
  };
  onClick: MouseEventHandler;
  onCreateChannel: () => void;
  onPreviewSelect: MouseEventHandler;
};

const MessagingSidebar = ({
  channelListOptions,
  onClick,
  onCreateChannel,
  onPreviewSelect,
}: MessagingSidebarProps) => {
  const { themeClassName } = useThemeContext();
  
  console.log('MessagingSidebar rendering with options:', channelListOptions);

  return (
    <div
      className={`str-chat messaging__sidebar ${themeClassName}`}
      id='mobile-channel-list'
      onClick={onClick}
    >
      <MessagingChannelListHeader onCreateChannel={onCreateChannel} />
      <ChannelList
        {...channelListOptions}
        Preview={(props) => {
          console.log('Channel data:', props.channel);
          return <MessagingChannelPreview {...props} onClick={onPreviewSelect} />;
        }}
        LoadingErrorIndicator={() => {
          console.log('ChannelList loading error');
          return <div>Channel loading error</div>;
        }}
        EmptyStateIndicator={() => {
          console.log('ChannelList empty state');
          return <div>No channels found</div>;
        }}
        LoadingIndicator={() => {
          console.log('ChannelList loading...');
          return <div>Loading channels...</div>;
        }}
      />
    </div>
  );
};

export default MessagingSidebar;
