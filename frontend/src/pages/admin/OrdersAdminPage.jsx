import { useState } from "react";
import S from "../../styles/index.js";
export default function AdminPedidos() {
  const [filtro, setFiltro] = useState("todos");
  const pedidos =
    filtro === "todos"
      ? DB.pedidosSede
      : DB.pedidosSede.filter((p) => p.estado === filtro);
  const colores = {
    completado: "#00C896",
    en_proceso: "#FF6B35",
    cancelado: "#FF6B6B",
  };
  return (
    <div>
      <SectionTitle>Pedidos de la sede ({DB.pedidosSede.length})</SectionTitle>
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
      {pedidos.length === 0 && <div style={S.emptyState}>Sin pedidos</div>}
      {[...pedidos].reverse().map((p) => (
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
              {p.id}
            </span>
            <span style={{ fontSize: 12, color: "#8888bb" }}>{p.fecha}</span>
          </div>
          <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 4 }}>
            👤 {p.clienteNombre}
          </div>
          <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 10 }}>
            {p.items}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0" }}>
              ${p.total.toFixed(2)}
            </span>
            <span
              style={{ ...S.badge, background: colores[p.estado] || "#666" }}
            >
              {p.estado.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
