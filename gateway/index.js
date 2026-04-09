const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { ApolloGateway, IntrospectAndCompose } = require("@apollo/gateway");

// ─── CONFIGURACIÓN DEL GATEWAY ────────────────────────────────────────────────
// Aquí se listan TODOS los microservicios que forman el grafo federado.
// Cada compañero debe agregar su servicio en esta lista.

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: "customer",
        url:
          process.env.CUSTOMER_SERVICE_URL ||
          "http://customer-service:8000/graphql",
      },
      {
        name: "loyalty",
        url:
          process.env.LOYALTY_SERVICE_URL ||
          "http://loyalty-service:8001/graphql",
      },
    ],
  }),
});

// ─── SERVIDOR ─────────────────────────────────────────────────────────────────
async function startGateway() {
  const server = new ApolloServer({
    gateway,
    // Permite introspección para que el frontend pueda explorar el esquema
    introspection: true,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000, host: "0.0.0.0" },
    // Extrae el token JWT del header y lo pasa a los subgrafos
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      const customerId = req.headers["x-customer-id"] || "";
      return {
        token,
        customerId,
        headers: {
          authorization: token,
          "x-customer-id": customerId,
        },
      };
    },
  });

  console.log(`🚀 Apollo Gateway corriendo en ${url}`);
  console.log(`📊 GraphQL Playground: ${url}`);
  console.log(`\n🔗 Subgrafos conectados:`);
  console.log(
    `   • customer-service → ${process.env.CUSTOMER_SERVICE_URL || "http://customer-service:8000/graphql"}`,
  );
  console.log(
    `   • loyalty-service  → ${process.env.LOYALTY_SERVICE_URL || "http://loyalty-service:8001/graphql"}`,
  );
}

startGateway().catch((err) => {
  console.error("❌ Error al iniciar el Gateway:", err);
  process.exit(1);
});
