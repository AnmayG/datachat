import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';

/**
 * Exports few channel list configuration options. See the docs for more information:
 * - https://getstream.io/chat/docs/sdk/react/core-components/channel_list/
 *
 * @param user the user id.
 */
export const getChannelListOptions = (
  user: string | undefined,
) => {
  console.log('getChannelListOptions called with user:', user);
  const filters: ChannelFilters = { type: 'messaging', members: { $in: [user!] } };
  console.log('Channel filters:', filters);

  const options: ChannelOptions = { state: true, watch: true, presence: true, limit: 8 };

  const sort: ChannelSort = {
    last_message_at: -1,
    // updated_at: -1,  // Commented out to fix multiple fields warning
  };

  return {
    filters,
    options,
    sort,
  };
};
