import { useState } from "react";
import S from "../../styles/index.js";
import {
  useMyPoints,
  usePointHistory,
  useRedeemPoints,
} from "../../api/hooks.js";

export default function PointsPage({ user, onCanje }) {
  // 1. Estados locales para navegación
  const [vista, setVista] = useState("recompensas");

  // 2. Hooks de datos (Conectados al nuevo backend de FastAPI)
  const { data: pointsData, loading: loadingPoints } = useMyPoints(user?.id);
  const { data: historyData, loading: loadingHistory } = usePointHistory(user?.id);
  const [redeemPoints] = useRedeemPoints(user?.id);

  // 3. Normalización de datos
  // totalPoints viene del balance real en PostgreSQL
  const totalPoints = pointsData?.myPoints?.totalPoints ?? 0;
  // historial viene de la tabla point_transactions
  const historial = historyData?.myPointHistory ?? [];

  // Los cupones se filtran del historial buscando deltas negativos (canjes)
  const cuponesCanjeados = historial.filter(tx => tx.points_delta < 0);

  if (loadingPoints || loadingHistory) {
    return <div style={S.emptyState}>Cargando tu billetera de puntos...</div>;
  }

  return (
    <div>
      {/* CARD DE PUNTOS TOTALES */}
      <div style={S.pointsCard}>
        <div style={{ fontSize: 12, color: "#8888bb", textTransform: "uppercase", letterSpacing: 1 }}>
          Balance Actual
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#FF6B35", margin: "8px 0 4px" }}>
          {totalPoints.toLocaleString()}
        </div>
        <div style={{ fontSize: 14, color: "#aaaacc" }}>
          ⭐ {totalPoints >= 1000 ? "¡Eres un cliente VIP!" : "Acumula puntos en cada compra"}
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ ...S.tabRow, marginTop: 20 }}>
        {[
          ["recompensas", "🎁 Canjear"],
          ["cupones", "🎟️ Mis Cupones"],
          ["historial", "📜 Actividad"],
        ].map(([id, label]) => (
          <button
            key={id}
            style={{ ...S.tabBtn, ...(vista === id ? S.tabBtnActive : {}) }}
            onClick={() => setVista(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SECCIÓN: CANJEAR RECOMPENSAS */}
      {vista === "recompensas" && (
        <div style={{ marginTop: 16 }}>
          <div style={S.grid2}>
            {(window.DB?.recompensas || []).map((r) => {
              const sinPuntos = totalPoints < r.puntosReq;

              return (
                <div
                  key={r.id}
                  style={{
                    ...S.rewardCard,
                    opacity: sinPuntos ? 0.7 : 1,
                    border: sinPuntos ? "1px solid #2a2a4a" : "1px solid rgba(255,107,53,0.4)",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{r.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{r.nombre}</div>
                  <div style={{ fontSize: 11, color: "#8888bb", margin: "4px 0 12px" }}>{r.desc}</div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: sinPuntos ? "#666" : "#FF6B35" }}>
                      {r.puntosReq} pts
                    </span>
                    <button
                      style={{
                        ...S.adminBtn,
                        padding: "6px 10px",
                        fontSize: 12,
                        background: sinPuntos ? "#222" : "rgba(255,107,53,0.2)",
                        cursor: sinPuntos ? "default" : "pointer"
                      }}
                      onClick={() => !sinPuntos && onCanje(r)}
                    >
                      {sinPuntos ? "Faltan pts" : "Canjear"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN: MIS CANJES (Extraídos del historial) */}
      {vista === "cupones" && (
        <div style={{ marginTop: 16 }}>
          {cuponesCanjeados.length === 0 ? (
            <div style={S.emptyState}>No tienes cupones activos</div>
          ) : (
            cuponesCanjeados.map((c) => (
              <div key={c.id} style={{ ...S.txRow, borderLeft: "4px solid #FF6B35", paddingLeft: 15 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#fff" }}>{c.description}</div>
                  <div style={{ fontSize: 11, color: "#6666aa" }}>Usado el {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#8888bb" }}>VALOR</div>
                  <div style={{ color: "#FF6B35", fontWeight: 800 }}>{Math.abs(c.points_delta)} pts</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECCIÓN: HISTORIAL DE MOVIMIENTOS (Real desde DB) */}
      {vista === "historial" && (
        <div style={{ marginTop: 16 }}>
          {historial.length === 0 ? (
            <div style={S.emptyState}>Aún no tienes movimientos de puntos</div>
          ) : (
            historial.map((tx) => {
              const esGanado = tx.points_delta > 0;
              return (
                <div key={tx.id} style={S.txRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#e8e8f0", fontWeight: 500 }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: 11, color: "#6666aa", marginTop: 2 }}>
                      {new Date(tx.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: esGanado ? "#00C896" : "#FF6B6B"
                  }}>
                    {esGanado ? "+" : ""}{tx.points_delta}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}