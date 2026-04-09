import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import S from "../../styles/index.js";
import {
  GET_LOYALTY_CONFIG,
  UPDATE_LOYALTY_CONFIG,
  GET_ALL_CLIENTS,
  GET_ALL_DISHES
} from "../../api/graphql.js";

const SectionTitle = ({ children }) => (
  <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 16, marginTop: 24, fontWeight: 700 }}>
    {children}
  </h2>
);

export default function AdminDashboard({ user, showToast }) {
  const [newRate, setNewRate] = useState("");

  // 1. Queries de Datos Reales
  const { data: configData } = useQuery(GET_LOYALTY_CONFIG);
  const { data: clientsData, loading: loadingClients } = useQuery(GET_ALL_CLIENTS);
  const { data: dishesData, loading: loadingDishes } = useQuery(GET_ALL_DISHES);

  // 2. Mutación para la Tasa de Puntos
  const [updateConfig, { loading: savingConfig }] = useMutation(UPDATE_LOYALTY_CONFIG, {
    onCompleted: () => {
      showToast("Tasa de puntos actualizada con éxito");
      setNewRate("");
    },
    onError: (err) => showToast("Error: " + err.message, "err"),
    refetchQueries: [{ query: GET_LOYALTY_CONFIG }]
  });

  const handleSaveConfig = () => {
    const val = parseFloat(newRate);
    if (isNaN(val) || val <= 0) return showToast("Ingresa un valor válido", "err");
    updateConfig({ variables: { points: val } });
  };

  // 3. Preparación de Estadísticas
  const clientes = clientsData?.allCustomers || [];
  const platos = dishesData?.allDishes || [];

  const totalPts = clientes.reduce((a, u) => a + (u.points || 0), 0);
  const totalReseñas = platos.reduce((a, p) => a + (p.reviews?.length || 0), 0);

  const platosMejorValorados = [...platos]
    .filter((p) => p.reviews && p.reviews.length > 0)
    .sort((a, b) => {
      const ra = a.reviews.reduce((s, r) => s + r.stars, 0) / a.reviews.length;
      const rb = b.reviews.reduce((s, r) => s + r.stars, 0) / b.reviews.length;
      return rb - ra;
    })
    .slice(0, 3);

  const stats = [
    { label: "Clientes totales", value: clientes.length, icon: "👥", color: "#00C896" },
    { label: "Puntos emitidos", value: totalPts.toLocaleString(), icon: "⭐", color: "#F9C74F" },
    { label: "Reseñas totales", value: totalReseñas, icon: "📝", color: "#7C5CFC" },
    { label: "Platos activos", value: platos.length, icon: "🍽️", color: "#FF6B35" },
  ];

  if (loadingClients || loadingDishes) {
    return <div style={{ color: "#8888bb", padding: 20 }}>Cargando métricas...</div>;
  }

  return (
    <div>
      <SectionTitle>Resumen de {user?.restaurant || "la sede"}</SectionTitle>

      <div style={S.grid2}>
        {stats.map((s, i) => (
          <div
            key={i}
            style={{ ...S.card, borderLeft: `4px solid ${s.color}`, textAlign: "center", padding: 20 }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#8888bb", marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* --- TARJETA DE CONFIGURACIÓN DE LEALTAD --- */}
      <div style={{
        ...S.formCard,
        marginTop: 24,
        marginBottom: 24,
        border: "1px solid rgba(255,107,53,0.3)",
        background: "rgba(255,107,53,0.02)"
      }}>
        <div style={{ fontWeight: 700, color: "#FF6B35", marginBottom: 12, fontSize: 13, textTransform: 'uppercase' }}>
          ⚙️ Configuración del Programa de Lealtad
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...S.label, fontSize: 11, color: '#8888bb' }}>Puntos otorgados por cada $1 gastado</label>
            <input
              style={{ ...S.input, marginTop: 4 }}
              type="number"
              step="0.1"
              placeholder={`Actual: ${configData?.loyaltyConfig?.pointsPerCurrency || "1.0"}`}
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
            />
          </div>
          <button
            style={{ ...S.primaryBtn, width: "auto", padding: "10px 20px", marginTop: 0 }}
            onClick={handleSaveConfig}
            disabled={savingConfig}
          >
            {savingConfig ? "..." : "Guardar Tasa"}
          </button>
        </div>
      </div>

      <SectionTitle>Platos mejor valorados</SectionTitle>

      {platosMejorValorados.length > 0 ? (
        platosMejorValorados.map((p) => {
          const rating = (
            p.reviews.reduce((s, r) => s + r.stars, 0) / p.reviews.length
          ).toFixed(1);

          return (
            <div key={p.id} style={S.txRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{p.emoji || "🍽️"}</span>
                <div>
                  <div style={{ fontSize: 14, color: "#e8e8f0", fontWeight: 600 }}>
                    {p.name || p.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: "#8888bb" }}>
                    {p.reviews.length} reseñas
                  </div>
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#FFD700" }}>
                ⭐ {rating}
              </span>
            </div>
          );
        })
      ) : (
        <div style={{ ...S.emptyState, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
          Aún no hay reseñas para mostrar el ranking de platos.
        </div>
      )}
    </div>
  );
}