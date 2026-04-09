import { useState } from "react";
import S from "../../styles/index.js";

export default function MenuTab({ user, onAgregar, setRatingModal }) {
  const [categoria, setCategoria] = useState("Todos");
  const categorias = ["Todos", ...new Set(DB.platos.map((p) => p.categoria))];
  const filtrados = DB.platos.filter(
    (p) => p.activo && (categoria === "Todos" || p.categoria === categoria),
  );

  return (
    <div>
      <SectionTitle>Menú del restaurante</SectionTitle>
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            style={{
              padding: "7px 14px",
              borderRadius: 20,
              border: "1px solid",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              background:
                categoria === c ? "rgba(255,107,53,0.2)" : "transparent",
              color: categoria === c ? "#FF6B35" : "#8888bb",
              borderColor: categoria === c ? "rgba(255,107,53,0.5)" : "#2a2a4a",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={S.grid2}>
        {filtrados.map((plato) => {
          const rating = DB.getRating(plato.id);
          const ya = DB.yaReseñó(plato.id, user?.id);
          return (
            <div
              key={plato.id}
              style={{
                ...S.dishCard,
                flexDirection: "column",
                alignItems: "stretch",
                gap: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 34 }}>{plato.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.dishName}>{plato.nombre}</div>
                  <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>
                    {plato.categoria}
                  </div>
                  <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>
                    {rating
                      ? `⭐ ${rating} (${DB.platos.find((p) => p.id === plato.id)?.reseñas.length})`
                      : "Sin valorar"}
                  </div>
                </div>
                <div
                  style={{ fontSize: 18, fontWeight: 800, color: "#FF6B35" }}
                >
                  ${plato.precio.toFixed(2)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    ...S.primaryBtn,
                    flex: 2,
                    marginTop: 0,
                    padding: "10px 0",
                    fontSize: 14,
                  }}
                  onClick={() => onAgregar(plato)}
                >
                  + Agregar
                </button>
                <button
                  style={{
                    ...S.rateBtn,
                    opacity: ya ? 0.4 : 1,
                    cursor: ya ? "not-allowed" : "pointer",
                    flex: 1,
                    textAlign: "center",
                  }}
                  onClick={() => !ya && setRatingModal(plato)}
                >
                  {ya ? "✅" : "⭐ Valorar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
