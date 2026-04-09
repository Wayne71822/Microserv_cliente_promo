/**
 * frontend/src/api/client.js — CORREGIDO
 *
 * PROBLEMA ANTERIOR: localStorage.getItem("auth0_token") devolvía null porque
 * Auth0 guarda sus tokens con claves internas propias, no con "auth0_token".
 *
 * SOLUCIÓN: El token ahora se guarda explícitamente en localStorage desde
 * AuthContext.jsx con la clave "auth0_token" DESPUÉS de obtenerlo con
 * getAccessTokenSilently(). Eso ya lo hace tu AuthContext correctamente.
 * Este archivo simplemente lo lee de ahí.
 *
 * Si el token no está aún (usuario no autenticado), la petición va sin header
 * y el Gateway la rechazará con error de autorización, lo cual es correcto.
 */

import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  // En Docker el frontend llama al gateway por su puerto expuesto en el host
  uri: import.meta.env.VITE_GATEWAY_URL || "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  // El token es guardado en AuthContext.jsx tras getAccessTokenSilently()
  const token = localStorage.getItem("auth0_token");

  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  // Muestra errores detallados en consola durante desarrollo
  connectToDevTools: true,
});

export default client;