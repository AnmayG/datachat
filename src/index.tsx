import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';

import App from './App';
import { getChannelListOptions } from './channelListOptions';
import { ThemeContextProvider } from './context';
import { UserResponse } from 'stream-chat';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://cfe9b30508b44e40908da83aee0743e9@o389650.ingest.sentry.io/5556314',
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
}

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('api_key') || process.env.REACT_APP_STREAM_KEY;
console.log('API Key: ', apiKey);
const targetOrigin =
  urlParams.get('target_origin') || process.env.REACT_APP_TARGET_ORIGIN || window.location.origin;

// User and token will now come from authentication
// Creating empty defaults that will be overridden by authenticated values
const channelListOptions = getChannelListOptions(undefined);
const userToConnect: UserResponse = {
  id: 'placeholder', // Will be replaced by authenticated user
  privacy_settings: {
    typing_indicators: {
      enabled: false,
    },
  },
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container!);
root.render(
  <React.StrictMode>
    <ThemeContextProvider targetOrigin={targetOrigin}>
      <App
        apiKey={apiKey!}
        userToConnect={userToConnect}
        userToken={undefined} // Token will come from authentication
        targetOrigin={targetOrigin!}
        channelListOptions={channelListOptions}
      />
    </ThemeContextProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
