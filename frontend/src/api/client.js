import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// La URL de tu Gateway
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// Este middleware se ejecuta ANTES de cada petición a GraphQL
const authLink = setContext(async (_, { headers }) => {
  // Intentamos sacar el token del localStorage (donde Auth0 lo guarda si configuramos cacheLocation="localstorage")
  // O mejor aún, el token se pasará desde las llamadas en los componentes.
  const token = localStorage.getItem("auth0_token");

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;