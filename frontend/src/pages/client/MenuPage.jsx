import { useState } from "react";
import { useQuery } from "@apollo/client";
import S from "../../styles/index.js"; // Correcto
import { GET_ALL_DISHES } from "../../api/graphql.js"; // Corregido: Subir 2 niveles
import { useMyRatings } from "../../api/hooks.js"; // Corregido: Importar la función y subir 2 niveles

export default function MenuTab({ user, onAgregar, setRatingModal }) {
  const [categoria, setCategoria] = useState("Todos");

  const { data: menuData, loading: menuLoading } = useQuery(GET_ALL_DISHES);
  const { data: ratingsData } = useMyRatings(); // Ahora sí funcionará

  if (menuLoading) return <div style={S.emptyState}>Cargando menú...</div>;

  const platos = menuData?.allDishes || [];
  const misReseñas = ratingsData?.myDishRatings || [];

  const categorias = ["Todos", ...new Set(platos.map((p) => p.category || p.categoria))];

  const filtrados = platos.filter(
    (p) => categoria === "Todos" || (p.category || p.categoria) === categoria
  );

  return (
    <div>
      <div style={S.sectionTitle}>Menú del restaurante</div>

      {/* Selector de Categorías */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
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
              background: categoria === c ? "rgba(255,107,53,0.2)" : "transparent",
              color: categoria === c ? "#FF6B35" : "#8888bb",
              borderColor: categoria === c ? "rgba(255,107,53,0.5)" : "#2a2a4a",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid de Platos */}
      <div style={S.grid}>
        {filtrados.map((plato) => {
          // Verificamos si este plato específico ya fue reseñado por el usuario actual
          const yaReseñado = misReseñas.some((r) => r.dishId === plato.id);

          return (
            <div key={plato.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{plato.emoji || "🍽️"}</div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>
                    {plato.name || plato.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>
                    {plato.category || plato.categoria}
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#FF6B35" }}>
                  ${parseFloat(plato.price || plato.precio).toFixed(2)}
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
                    opacity: yaReseñado ? 0.4 : 1,
                    cursor: yaReseñado ? "not-allowed" : "pointer",
                    flex: 1,
                    textAlign: "center",
                  }}
                  onClick={() => !yaReseñado && setRatingModal(plato)}
                >
                  {yaReseñado ? "✅" : "⭐ Valorar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}