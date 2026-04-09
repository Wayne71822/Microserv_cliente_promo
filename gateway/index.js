/**
 * gateway/index.js — CORREGIDO
 *
 * CAMBIO 1: Se eliminó menu-service de los subgrafos.
 * IntrospectAndCompose falla COMPLETAMENTE si cualquier subgrafo no responde.
 * Cuando el compañero tenga su menu-service listo, solo hay que descomentar
 * el bloque correspondiente y agregar el healthcheck en docker-compose.yml.
 *
 * CAMBIO 2: Se agregó reintentos en el arranque para tolerar race conditions.
 */

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } = require("@apollo/gateway");
const jwt = require("jsonwebtoken");

// ─── SUBGRAFOS ACTIVOS ────────────────────────────────────────────────────────
// Solo agregar aquí servicios que estén corriendo y saludables.
// El gateway fallará si cualquier URL de esta lista no responde.

const subgraphs = [
  {
    name: "customer",
    url: process.env.CUSTOMER_SERVICE_URL || "http://customer-service:8000/graphql",
  },
  {
    name: "loyalty",
    url: process.env.LOYALTY_SERVICE_URL || "http://loyalty-service:8001/graphql",
  },

  // ── Descomentar cuando el compañero tenga menu-service corriendo ──────────
  // {
  //   name: "menu",
  //   url: process.env.MENU_SERVICE_URL || "http://menu-service:8002/graphql",
  // },
];

// ─── GATEWAY ──────────────────────────────────────────────────────────────────
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({ subgraphs }),

  // Reenvía el token y el customer ID a cada microservicio
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

// ─── ARRANQUE CON REINTENTOS ──────────────────────────────────────────────────
async function startGateway(intento = 1, maxIntentos = 5) {
  try {
    const server = new ApolloServer({
      gateway,
      introspection: true,
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000, host: "0.0.0.0" },

      context: async ({ req }) => {
        const token = req.headers.authorization || "";
        let customerId = req.headers["x-customer-id"] || "";

        // Extraemos el sub (ID de Auth0) del JWT para identificar al cliente
        if (token.startsWith("Bearer ")) {
          try {
            const decoded = jwt.decode(token.split(" ")[1]);
            if (decoded?.sub) customerId = decoded.sub;
          } catch (err) {
            console.error("❌ Error al decodificar JWT:", err.message);
          }
        }

        return { token, customerId };
      },
    });

    console.log(`\n✅ Apollo Gateway corriendo en ${url}`);
    console.log(`\n🔗 Subgrafos conectados:`);
    subgraphs.forEach(s => console.log(`   • ${s.name} → ${s.url}`));

  } catch (err) {
    console.error(`\n❌ Error al iniciar Gateway (intento ${intento}/${maxIntentos}):`, err.message);

    if (intento < maxIntentos) {
      const espera = intento * 3000; // 3s, 6s, 9s, 12s
      console.log(`⏳ Reintentando en ${espera / 1000}s...`);
      await new Promise(r => setTimeout(r, espera));
      return startGateway(intento + 1, maxIntentos);
    }

    console.error("💥 Gateway no pudo iniciar después de todos los intentos.");
    process.exit(1);
  }
}

startGateway();