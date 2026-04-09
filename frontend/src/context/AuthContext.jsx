import { createContext, useContext, useState } from "react";
import client from "../api/client.js";
import { REGISTER_CUSTOMER, GET_ME, UPDATE_PROFILE } from "../api/graphql.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [country, setCountry] = useState("");
  const [restaurant, setRestaurant] = useState("");

  const handleRegister = async (datos) => {
    try {
      const { data } = await client.mutate({
        mutation: REGISTER_CUSTOMER,
        variables: {
          auth0Id: "local-" + Date.now(), // ID temporal sin Auth0
          email: datos.email,
          name: datos.name,
        },
      });
      setUser(data.registerCustomer);
      return true;
    } catch (e) {
      console.error("Register error:", e);
      return false;
    }
  };

  const handleLogin = async (email, password) => {
    // Sin Auth0 por ahora: buscamos el perfil por email simulando el ID
    // Cuando integres Auth0 esto se reemplaza por el token real
    try {
      const { data } = await client.query({
        query: GET_ME,
        context: {
          headers: { "x-customer-id": email }, // temporal
        },
      });
      if (!data.me) return null;
      setUser(data.me);
      if (data.me.countryId) {
        setCountry(data.me.countryId);
        setRestaurant(data.me.preferredRestaurantId || "");
      }
      return data.me;
    } catch (e) {
      console.error("Login error:", e);
      return null;
    }
  };

  const updateUser = async (cambios) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_PROFILE,
        variables: cambios,
        context: {
          headers: { "x-customer-id": user.id },
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

  const handleLogout = () => {
    setUser(null);
    setCountry("");
    setRestaurant("");
    client.clearStore();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        updateUser,
        country,
        setCountry,
        restaurant,
        setRestaurant,
        handleLogin,
        handleRegister,
        handleOnboarding,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
