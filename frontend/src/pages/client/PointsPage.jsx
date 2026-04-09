import { useState } from "react";
import S from "../../styles/index.js";
import {
  useMyPoints,
  usePointHistory,
  useRedeemPoints,
} from "../../api/hooks.js";

export default function PointsPage({ user, onCanje }) {
  const { data: pointsData, loading: loadingPoints } = useMyPoints(user?.id);
  const { data: historyData, loading: loadingHistory } = usePointHistory(
    user?.id,
  );
  const [redeemPoints] = useRedeemPoints(user?.id);

  const totalPoints = pointsData?.myPoints?.totalPoints ?? 0;
  const historial = historyData?.myPointHistory ?? [];
  return (
    <div>
      <div style={S.pointsCard}>
        <div
          style={{
            fontSize: 12,
            color: "#8888bb",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Mis puntos
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#FF6B35",
            margin: "8px 0 4px",
          }}
        >
          {points.toLocaleString()}
        </div>
        <div style={{ fontSize: 14, color: "#aaaacc" }}>
          ⭐ puntos acumulados · sin límite
        </div>
      </div>

      <div style={{ ...S.tabRow, marginTop: 20 }}>
        {[
          ["recompensas", "🎁 Canjear"],
          ["cupones", "🎟️ Mis canjes"],
          ["historial", "📜 Historial"],
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

      {vista === "recompensas" && (
        <div>
          <p style={{ fontSize: 12, color: "#6666aa", marginBottom: 16 }}>
            Canjea tus puntos por productos o cupones
          </p>
          <div style={S.grid2}>
            {DB.recompensas
              .filter((r) => r.activa)
              .map((r) => {
                const puedo = DB.puedesCanjear(user.id, r);
                const yaCanjeó = DB.canjesDeRecompensa(user.id, r.id);
                const limite = r.limiteXUsuario;
                const agotado = limite !== null && yaCanjeó >= limite;
                const sinPuntos = points < r.puntosReq;
                const razon = agotado
                  ? `Límite: ${limite}/${limite}`
                  : sinPuntos
                    ? `Faltan ${r.puntosReq - points} pts`
                    : "";
                return (
                  <div
                    key={r.id}
                    style={{
                      ...S.rewardCard,
                      opacity: puedo ? 1 : 0.6,
                      borderColor: puedo ? "rgba(255,107,53,0.35)" : "#2a2a4a",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>
                      {r.emoji}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#fff",
                        marginBottom: 4,
                      }}
                    >
                      {r.nombre}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#8888bb",
                        marginBottom: 8,
                      }}
                    >
                      {r.desc}
                    </div>
                    {limite !== null && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6666aa",
                          marginBottom: 8,
                        }}
                      >
                        Canjes: {yaCanjeó}/{limite}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: puedo ? "#FF6B35" : "#666688",
                        }}
                      >
                        {r.puntosReq} pts
                      </span>
                      <button
                        style={{
                          ...S.rateBtn,
                          opacity: puedo ? 1 : 0.4,
                          cursor: puedo ? "pointer" : "not-allowed",
                          background: puedo
                            ? "rgba(255,107,53,0.15)"
                            : "rgba(100,100,120,0.1)",
                          color: puedo ? "#FF6B35" : "#666688",
                        }}
                        onClick={() => puedo && onCanje(r)}
                        title={razon}
                      >
                        {agotado
                          ? "Agotado"
                          : sinPuntos
                            ? "Insuficiente"
                            : "Canjear →"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {vista === "cupones" && (
        <div>
          {cupones.length === 0 ? (
            <div style={S.emptyState}>No has canjeado nada aún</div>
          ) : (
            [...cupones].reverse().map((c, i) => (
              <div
                key={i}
                style={{
                  background: "#1a1a2e",
                  border: "1px solid #2a2a4a",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}
                    >
                      {c.nombre}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#8888bb", marginTop: 3 }}
                    >
                      Canjeado: {c.fecha}
                    </div>
                  </div>
                  {c.codigo && (
                    <div
                      style={{
                        background: "rgba(255,107,53,0.15)",
                        border: "1px dashed #FF6B35",
                        borderRadius: 8,
                        padding: "6px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#8888bb",
                          marginBottom: 2,
                        }}
                      >
                        CÓDIGO
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: "#FF6B35",
                          letterSpacing: 2,
                        }}
                      >
                        {c.codigo}
                      </div>
                    </div>
                  )}
                  {!c.codigo && <span style={{ fontSize: 22 }}>✅</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {vista === "historial" && (
        <div>
          {historial.length === 0 ? (
            <div style={S.emptyState}>Sin movimientos aún</div>
          ) : (
            [...historial].reverse().map((tx) => (
              <div key={tx.id} style={S.txRow}>
                <div>
                  <div style={{ fontSize: 13, color: "#e8e8f0" }}>
                    {tx.desc}
                  </div>
                  <div style={{ fontSize: 11, color: "#6666aa", marginTop: 3 }}>
                    {tx.fecha}
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: tx.delta > 0 ? "#00C896" : "#FF6B6B",
                  }}
                >
                  {tx.delta > 0 ? "+" : ""}
                  {tx.delta} pts
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
