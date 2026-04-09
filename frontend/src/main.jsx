import { ApolloProvider } from "@apollo/client";
import client from "./api/client.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ApolloProvider>,
);
