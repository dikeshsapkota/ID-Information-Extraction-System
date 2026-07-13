import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

const content = domain && clientId && audience ? (
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      audience,
      redirect_uri: window.location.origin,
    }}
  >
    <App />
  </Auth0Provider>
) : (
  <main className="configuration-error">
    Authentication configuration is missing.
  </main>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{content}</React.StrictMode>
);
