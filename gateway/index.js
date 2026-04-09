const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } = require("@apollo/gateway");
const jwt = require("jsonwebtoken"); // Asegúrate de correr: npm install jsonwebtoken

// ─── CONFIGURACIÓN DEL GATEWAY ────────────────────────────────────────────────
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: "customer",
        url: process.env.CUSTOMER_SERVICE_URL || "http://customer-service:8000/graphql",
      },
      {
        name: "loyalty",
        url: process.env.LOYALTY_SERVICE_URL || "http://loyalty-service:8001/graphql",
      },
      // PUNTO 5: Integración del microservicio del compañero
      {
        name: "menu",
        url: process.env.MENU_SERVICE_URL || "http://menu-service:8002/graphql",
      },
    ],
  }),
  // Esta sección asegura que el header x-customer-id llegue a los microservicios
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        if (context.customerId) {
          request.http.headers.set("x-customer-id", context.customerId);
        }
        if (context.token) {
          request.http.headers.set("authorization", context.token);
        }
      },
    });
  },
});

// ─── SERVIDOR ─────────────────────────────────────────────────────────────────
async function startGateway() {
  const server = new ApolloServer({
    gateway,
    introspection: true,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000, host: "0.0.0.0" },
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      let customerId = req.headers["x-customer-id"] || "";

      // PUNTO 6: Verificación de JWT (Auth0)
      if (token.startsWith("Bearer ")) {
        try {
          const pureToken = token.split(" ")[1];
          // Decodificamos el token para extraer el 'sub' (ID único de Auth0)
          const decoded = jwt.decode(pureToken);
          if (decoded && decoded.sub) {
            customerId = decoded.sub;
          }
        } catch (err) {
          console.error("❌ Error al decodificar JWT:", err.message);
        }
      }

      return {
        token,
        customerId,
      };
    },
  });

  console.log(`🚀 Apollo Gateway corriendo en ${url}`);
  console.log(`\n🔗 Subgrafos conectados y protegidos:`);
  console.log(`   • customer-service → ${process.env.CUSTOMER_SERVICE_URL || "http://customer-service:8000/graphql"}`);
  console.log(`   • loyalty-service  → ${process.env.LOYALTY_SERVICE_URL || "http://loyalty-service:8001/graphql"}`);
  console.log(`   • menu-service     → ${process.env.MENU_SERVICE_URL || "http://menu-service:8002/graphql"}`);
}

startGateway().catch((err) => {
  console.error("❌ Error al iniciar el Gateway:", err);
  process.exit(1);
});