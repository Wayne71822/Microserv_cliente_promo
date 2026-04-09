import { useState, useMemo } from "react";
import S from "../../styles/index.js";
import { useActivePromotions } from "../../api/hooks.js";

const SectionTitle = ({ children }) => (
  <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 16, fontWeight: 700 }}>
    {children}
  </h2>
);

export default function PromosPage({ user, carrito = [] }) {
  const { data, loading } = useActivePromotions(
    user?.id,
    user?.preferredRestaurantId
  );

  // Usamos los datos del subgrafo de promociones
  const promos = data?.activePromotions ?? [];

  // Lógica para detectar qué promos aplican al carrito sin usar DB.promosParaCarrito
  const idsPromoAplicables = useMemo(() => {
    if (!carrito.length) return new Set();

    return new Set(
      promos.filter(p => {
        // Si no tiene restricciones, aplica a todo (y por ende al carrito)
        if (!p.applicableCategories?.length && !p.applicableDishes?.length) return true;

        // Verificar si algún item del carrito coincide con categorías o IDs de la promo
        return carrito.some(item =>
          p.applicableCategories?.includes(item.plato?.category || item.plato?.categoria) ||
          p.applicableDishes?.includes(item.plato?.id)
        );
      }).map(p => p.id)
    );
  }, [promos, carrito]);

  if (loading) {
    return <div style={{ color: "#8888bb", padding: 24 }}>Cargando promociones...</div>;
  }

  const colores = {
    POR_TIEMPO: "#FF6B35",
    POR_STOCK: "#7C5CFC",
    por_tiempo: "#FF6B35",
    por_stock: "#7C5CFC"
  };

  return (
    <div>
      <SectionTitle>Promociones activas ({promos.length})</SectionTitle>
      <p
        style={{
          fontSize: 12,
          color: "#6666aa",
          marginBottom: 16,
          marginTop: -8,
        }}
      >
        Las promos marcadas con ✅ aplican a tu carrito actual
      </p>

      {promos.length === 0 ? (
        <div style={S.emptyState}>😔 No hay promos activas en este momento</div>
      ) : (
        <div style={S.grid2}>
          {promos.map((p) => {
            const tipoNormalizado = p.promoType || p.tipo || "POR_TIEMPO";
            const color = colores[tipoNormalizado] || "#FF6B35";
            const aplicaAhora = idsPromoAplicables.has(p.id);

            // Descripción de aplicación dinámica
            const textoAplica =
              (!p.applicableCategories?.length && !p.applicableDishes?.length)
                ? "Aplica a todo el pedido"
                : `Aplica en: ${[...(p.applicableCategories || []), ...(p.applicableDishes || [])].join(", ")}`;

            return (
              <div
                key={p.id}
                style={{
                  ...S.card,
                  borderLeft: `4px solid ${color}`,
                  position: "relative",
                  padding: 16,
                  minHeight: 140
                }}
              >
                {aplicaAhora && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      fontSize: 11,
                      color: "#00C896",
                      fontWeight: 700,
                      background: "rgba(0,200,150,0.1)",
                      padding: "2px 6px",
                      borderRadius: 4
                    }}
                  >
                    ✅ Aplica
                  </div>
                )}

                <div style={{ marginBottom: 8, paddingRight: 60 }}>
                  <div style={{ ...S.dishName, fontSize: 15 }}>{p.name || p.nombre}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                    <span style={{ ...S.badge, background: color, fontSize: 9 }}>
                      {tipoNormalizado.replace("POR_", "")}
                    </span>
                    <span
                      style={{
                        ...S.badge,
                        background: (p.scope || "").toLowerCase() === "global" ? "#00C896" : "#FF6B35",
                        fontSize: 9
                      }}
                    >
                      {(p.scope || "SEDE").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 6, lineHeight: "1.4" }}>
                  {p.description || p.desc}
                </div>

                <div style={{ fontSize: 11, color: "#6666aa", marginBottom: 8, fontStyle: 'italic' }}>
                  {textoAplica}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color }}>
                    -{p.discountPct || p.descuentoPct}%
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {p.stock !== undefined && (
                      <div style={{ fontSize: 10, color: "#8888bb" }}>
                        Disponibles: {p.stock}
                      </div>
                    )}
                    {(p.validUntil || p.validHasta) && (
                      <div style={{ fontSize: 10, color: "#8888bb" }}>
                        Hasta: {new Date(p.validUntil || p.validHasta).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}