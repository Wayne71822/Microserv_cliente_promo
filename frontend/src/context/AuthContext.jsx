import { createContext, useContext, useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import client from "../api/client.js";
import { REGISTER_CUSTOMER, GET_ME, UPDATE_PROFILE } from "../api/graphql.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  const [user, setUser] = useState(null);
  const [country, setCountry] = useState("");
  const [restaurant, setRestaurant] = useState("");

  // EFECTO: Sincronización con Microservicios y persistencia de Token
  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && auth0User) {
        try {
          // 1. Obtenemos el JWT real de Auth0
          const token = await getAccessTokenSilently();

          // 2. Guardamos el token en localStorage para que Apollo Client lo use automáticamente
          localStorage.setItem("auth0_token", token);

          // 3. Buscamos el perfil en nuestro microservicio de clientes
          const { data } = await client.query({
            query: GET_ME,
            context: {
              headers: {
                Authorization: `Bearer ${token}`
              },
            },
          });

          if (data?.me) {
            setUser(data.me);
            setCountry(data.me.countryId || "");
            setRestaurant(data.me.preferredRestaurantId || "");
          } else {
            // Registro automático si es la primera vez que entra a la app
            await handleRegister(auth0User);
          }
        } catch (e) {
          console.error("Error sincronizando usuario:", e);
        }
      }
    };
    syncUser();
  }, [isAuthenticated, auth0User, getAccessTokenSilently]);

  const handleRegister = async (a0User) => {
    try {
      const token = await getAccessTokenSilently();
      const { data } = await client.mutate({
        mutation: REGISTER_CUSTOMER,
        variables: {
          auth0Id: a0User.sub,
          email: a0User.email,
          name: a0User.name || a0User.nickname,
        },
        context: {
          headers: { Authorization: `Bearer ${token}` }
        }
      });
      setUser(data.registerCustomer);
      return true;
    } catch (e) {
      console.error("Register error:", e);
      return false;
    }
  };

  const handleLogin = () => loginWithRedirect();

  const handleLogout = () => {
    // Limpiamos el token al cerrar sesión para evitar peticiones fallidas
    localStorage.removeItem("auth0_token");
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    setUser(null);
    setCountry("");
    setRestaurant("");
    client.clearStore();
  };

  const updateUser = async (cambios) => {
    try {
      const token = await getAccessTokenSilently();
      const { data } = await client.mutate({
        mutation: UPDATE_PROFILE,
        variables: cambios,
        context: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      setUser((prev) => ({ ...prev, ...data.updateProfile }));
    } catch (e) {
      console.error("Update error:", e);
    }
  };

  const handleOnboarding = async () => {
    if (!country || !restaurant) return false;
    await updateUser({
      countryId: country,
      preferredRestaurantId: restaurant,
    });
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        country,
        setCountry,
        restaurant,
        setRestaurant,
        handleLogin,
        handleLogout,
        handleOnboarding,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);