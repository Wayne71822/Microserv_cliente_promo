import { useState } from "react";
import S from "../../styles/index.js";

export default function HistoryTab({ user }) {
  const pedidos = user?.pedidos || [];
  return (
    <div>
      <SectionTitle>Mis pedidos ({pedidos.length})</SectionTitle>
      {pedidos.length === 0 && (
        <div style={S.emptyState}>No has realizado pedidos aún</div>
      )}
      <div style={S.grid2}>
        {[...pedidos].reverse().map((p) => (
          <div key={p.id} style={S.orderCard}>
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
            {p.promo && (
              <div style={{ fontSize: 11, color: "#00C896", marginBottom: 4 }}>
                🎁 {p.promo}
              </div>
            )}
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
              <span style={{ fontSize: 12, color: "#00C896" }}>
                +{p.pts} pts ✅
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
