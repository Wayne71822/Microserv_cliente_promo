import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { ApolloProvider } from "@apollo/client";
import client from "./api/client.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import App from "./App.jsx";

// CORRECCIÓN: Los valores deben ir entre comillas
const domain = "dev-casxiurnalctzc4l.us.auth0.com";
const clientId = "wn7wschIqVbK8lzbgC5FyN8wijxHThMa";
const audience = "https://restohub-api";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: "openid profile email"
      }}
      cacheLocation="localstorage"
    >
      <ApolloProvider client={client}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ApolloProvider>
    </Auth0Provider>
  </React.StrictMode>
);