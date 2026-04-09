import { useState } from "react";
import S from "../../styles/index.js";

export default function AdminDashboard({ user }) {
  // Solo clientes de la misma sede del admin
  const clientes = DB.clientesDeSede(user?.country, user?.restaurant);
  const totalPts = clientes.reduce((a, u) => a + (u.points || 0), 0);
  const totalReseñas = DB.platos.reduce((a, p) => a + p.reseñas.length, 0);

  return (
    <div>
      <SectionTitle>Resumen de {user?.restaurant || "la sede"}</SectionTitle>
      <div style={S.grid2}>
        {[
          {
            label: "Clientes de la sede",
            value: clientes.length,
            icon: "👥",
            color: "#00C896",
          },
          {
            label: "Pedidos",
            value: DB.pedidosSede.length,
            icon: "📋",
            color: "#FF6B35",
          },
          {
            label: "Promos activas",
            value: DB.promos.filter((p) => p.activa).length,
            icon: "🎁",
            color: "#7C5CFC",
          },
          {
            label: "Platos activos",
            value: DB.platos.filter((p) => p.activo).length,
            icon: "🍽️",
            color: "#FFD700",
          },
          {
            label: "Puntos emitidos",
            value: totalPts.toLocaleString(),
            icon: "⭐",
            color: "#FF6B35",
          },
          {
            label: "Reseñas",
            value: totalReseñas,
            icon: "📝",
            color: "#00C896",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{ ...S.orderCard, textAlign: "center", padding: 20 }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#8888bb", marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <SectionTitle>Platos mejor valorados</SectionTitle>
      {DB.platos
        .filter((p) => p.reseñas.length > 0)
        .sort((a, b) => {
          const ra =
            a.reseñas.reduce((s, r) => s + r.stars, 0) / a.reseñas.length;
          const rb =
            b.reseñas.reduce((s, r) => s + r.stars, 0) / b.reseñas.length;
          return rb - ra;
        })
        .slice(0, 3)
        .map((p) => {
          const r = (
            p.reseñas.reduce((s, r) => s + r.stars, 0) / p.reseñas.length
          ).toFixed(1);
          return (
            <div key={p.id} style={S.txRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{p.emoji}</span>
                <div>
                  <div
                    style={{ fontSize: 14, color: "#e8e8f0", fontWeight: 600 }}
                  >
                    {p.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: "#8888bb" }}>
                    {p.reseñas.length} reseñas
                  </div>
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#FFD700" }}>
                ⭐ {r}
              </span>
            </div>
          );
        })}
      {DB.platos.every((p) => p.reseñas.length === 0) && (
        <div style={S.emptyState}>Sin reseñas todavía</div>
      )}
    </div>
  );
}
