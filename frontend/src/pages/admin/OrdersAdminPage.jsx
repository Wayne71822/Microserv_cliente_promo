import { useState } from "react";
import S from "../../styles/index.js";

const SectionTitle = ({ children }) => (
  <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 16, fontWeight: 700 }}>
    {children}
  </h2>
);

export default function AdminPedidos() {
  const [filtro, setFiltro] = useState("todos");

  // NOTA: 'pedidosRaw' se conectará a tu Query de GraphQL (ej. allOrders).
  // Por ahora usamos un array vacío para que la app no lance el error de "DB is not defined".
  const pedidosRaw = [];

  const pedidos =
    filtro === "todos"
      ? pedidosRaw
      : pedidosRaw.filter((p) => p.status === filtro || p.estado === filtro);

  const colores = {
    completado: "#00C896",
    completed: "#00C896",
    en_proceso: "#FF6B35",
    processing: "#FF6B35",
    cancelado: "#FF6B6B",
    cancelled: "#FF6B6B",
  };

  return (
    <div>
      <SectionTitle>Pedidos de la sede ({pedidosRaw.length})</SectionTitle>

      <div style={{ ...S.tabRow, marginBottom: 16 }}>
        {[
          ["todos", "Todos"],
          ["completado", "Completados"],
          ["en_proceso", "En proceso"],
        ].map(([id, label]) => (
          <button
            key={id}
            style={{ ...S.tabBtn, ...(filtro === id ? S.tabBtnActive : {}) }}
            onClick={() => setFiltro(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
          No hay pedidos registrados {filtro !== "todos" ? `en estado "${filtro}"` : ""}
        </div>
      ) : (
        [...pedidos].reverse().map((p) => (
          <div
            key={p.id}
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
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: "#FF6B35" }}>
                ID: {p.id.substring(0, 8)}...
              </span>
              <span style={{ fontSize: 12, color: "#8888bb" }}>
                {p.createdAt || p.fecha || "Reciente"}
              </span>
            </div>

            <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 4 }}>
              👤 {p.customer?.name || p.clienteNombre || "Cliente desconocido"}
            </div>

            <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 10 }}>
              {p.itemsSummary || p.items || "Sin detalle de productos"}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0" }}>
                ${(p.total || 0).toFixed(2)}
              </span>
              <span
                style={{
                  ...S.badge,
                  background: colores[p.status || p.estado] || "#666",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff"
                }}
              >
                {(p.status || p.estado || "PENDIENTE").replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}