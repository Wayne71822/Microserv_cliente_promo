import { useState } from "react";
import S from "../../styles/index.js";

// Componente auxiliar para el título
const SectionTitle = ({ children }) => (
  <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 16, fontWeight: 700 }}>
    {children}
  </h2>
);

export default function AdminClientes({ user }) {
  const [busq, setBusq] = useState("");

  // Temporalmente vacío hasta conectar con el microservicio de clientes (Apollo/GraphQL)
  const clientes = [];

  const filtrados = clientes.filter(
    (u) =>
      !busq ||
      u.name?.toLowerCase().includes(busq.toLowerCase()) ||
      u.email?.toLowerCase().includes(busq.toLowerCase())
  );

  return (
    <div>
      <SectionTitle>
        Clientes de {user?.restaurant || "la sede"} ({clientes.length})
      </SectionTitle>

      <input
        style={{ ...S.input, marginBottom: 16 }}
        placeholder="Buscar por nombre o email..."
        value={busq}
        onChange={(e) => setBusq(e.target.value)}
      />

      {filtrados.length === 0 && (
        <div style={S.emptyState}>
          {clientes.length === 0
            ? "Sin clientes registrados en esta sede"
            : "Sin resultados"}
        </div>
      )}

      {filtrados.map((c) => {
        // Fallbacks seguros para evitar errores de referencia
        const reseñas = c.reviewsCount || 0;
        const canjes = (c.cuponesCanjeados || []).length;
        const pedidos = (c.pedidos || []).length;

        return (
          <div
            key={c.id}
            style={{
              background: "#1a1a2e",
              border: "1px solid #2a2a4a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#FF6B35,#FF3CAC)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {(c.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 12, color: "#8888bb" }}>
                  {c.email} · {c.country || user?.country}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontSize: 22, fontWeight: 900, color: "#FF6B35" }}
                >
                  {(c.points || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#8888bb" }}>puntos</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                borderTop: "1px solid #2a2a4a",
                paddingTop: 10,
              }}
            >
              {[
                ["📋", "Pedidos", pedidos],
                ["📝", "Reseñas", reseñas],
                ["🎟️", "Canjes", canjes],
              ].map(([icon, label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: "#e8e8f0" }}
                  >
                    {icon} {val}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6666aa",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}