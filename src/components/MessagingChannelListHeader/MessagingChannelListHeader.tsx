import React from 'react';
import { Avatar, useChatContext } from 'stream-chat-react';
import { useNavigate } from 'react-router-dom';

import { CreateChannelIcon, HandshakeIcon } from '../../assets';
import streamLogo from '../../assets/ProfilePic_LogoMark_GrdntOnWt.png';
import { ThemeToggle } from '../ThemeToggle';

type Props = {
  onCreateChannel?: () => void;
};

const MessagingChannelListHeader = React.memo((props: Props) => {
  const { onCreateChannel } = props;
  const navigate = useNavigate();

  const { client } = useChatContext();

  const { id, image = streamLogo as string, name = 'Example User' } = client.user || {};

  return (
      <div className='messaging__channel-list__header'>
        <Avatar image={image} name={name} />
        <div className={`messaging__channel-list__header__name`}>{name || id}</div>
        <div className="messaging__channel-list__header__buttons">
          <ThemeToggle />
          <button
            className={`messaging__channel-list__header__button`}
            onClick={() => navigate('/handshake')}
            title="Handshake Detection"
          >
            <HandshakeIcon />
          </button>
          <button
            className={`messaging__channel-list__header__button`}
            onClick={onCreateChannel}
            title="Create Channel"
          >
            <CreateChannelIcon />
          </button>
        </div>
      </div>
  );
});

export default React.memo(MessagingChannelListHeader);
