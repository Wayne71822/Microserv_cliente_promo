import { useState } from "react";
import S from "../../styles/index.js";

const SectionTitle = ({ children }) => (
  <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 16, marginTop: 24, fontWeight: 700 }}>
    {children}
  </h2>
);

export default function HomePage({
  user,
  showToast,
  setRatingModal,
  setActiveTab,
}) {
  // NOTA: 'pedidos' y 'reseñas' vendrán del objeto user o de queries de Apollo
  const pedidos = user?.pedidos || [];
  const cupones = user?.cuponesCanjeados || [];

  // Para las reseñas enviadas y pendientes, usamos estados que se sincronizarán con el servidor
  // Por ahora los protegemos con valores por defecto para evitar el crash
  const platosDisponibles = [];
  const misReseñas = user?.reviews || [];

  const tieneReseñasPendientes =
    pedidos.length > 0 && platosDisponibles.some((p) => !misReseñas.find(r => r.dishId === p.id));

  const stats = [
    {
      icon: "📋",
      label: "Pedidos realizados",
      value: pedidos.length,
      color: "#FF6B35",
    },
    {
      icon: "⭐",
      label: "Puntos acumulados",
      value: (user?.points || 0).toLocaleString(),
      color: "#FFD700",
    },
    {
      icon: "🎟️",
      label: "Cupones canjeados",
      value: cupones.length,
      color: "#7C5CFC",
    },
    {
      icon: "📝",
      label: "Reseñas enviadas",
      value: misReseñas.length,
      color: "#00C896",
    },
  ];

  return (
    <div>
      <div style={S.welcomeCard}>
        <div style={{ fontSize: 36 }}>👋</div>
        <div style={{ flex: 1 }}>
          <div style={S.welcomeName}>Hola, {user?.name?.split(" ")[0] || 'Cliente'}</div>
          <div style={{ fontSize: 13, color: "#8888bb", marginTop: 4 }}>
            {user?.restaurant || 'RestoHub'} · {user?.country || 'General'}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FF6B35" }}>
            {user?.points || 0}
          </div>
          <div style={{ fontSize: 11, color: "#8888bb" }}>puntos</div>
        </div>
      </div>

      <SectionTitle>Mi resumen</SectionTitle>
      <div style={S.grid2}>
        {stats.map((s, i) => (
          <div key={i} style={{ ...S.card, textAlign: 'center', padding: '15px 10px' }}>
            <div style={{ fontSize: 26 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {pedidos.length === 0 && (
        <div style={{ ...S.emptyState, marginTop: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontWeight: 600, color: "#e8e8f0", marginBottom: 6 }}>
            ¡Haz tu primer pedido!
          </div>
          <div style={{ fontSize: 13, color: "#8888bb", marginBottom: 16 }}>
            Ve al menú y agrega platos a tu carrito
          </div>
          <button
            style={{
              ...S.primaryBtn,
              width: "auto",
              padding: "12px 24px",
              marginTop: 0,
            }}
            onClick={() => setActiveTab("menu")}
          >
            Ver menú →
          </button>
        </div>
      )}

      {tieneReseñasPendientes && (
        <>
          <SectionTitle>Platos sin valorar</SectionTitle>
          <div style={S.grid2}>
            {platosDisponibles
              .filter((p) => p.active && !misReseñas.find(r => r.dishId === p.id))
              .slice(0, 4)
              .map((plato) => (
                <div key={plato.id} style={S.dishCard}>
                  <span style={{ fontSize: 26 }}>{plato.emoji || "🍽️"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={S.dishName}>{plato.name || plato.nombre}</div>
                    <div style={{ fontSize: 12, color: "#8888bb" }}>
                      Sin tu valoración
                    </div>
                  </div>
                  <button
                    style={S.rateBtn}
                    onClick={() => setRatingModal(plato)}
                  >
                    Valorar
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}