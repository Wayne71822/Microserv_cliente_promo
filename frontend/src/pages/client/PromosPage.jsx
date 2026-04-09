import { useState } from "react";
import S from "../../styles/index.js";
import { useActivePromotions } from "../../api/hooks.js";

export default function PromosPage({ user, carrito }) {
  const { data, loading } = useActivePromotions(
    user?.id,
    user?.preferredRestaurantId,
  );
  const promos = data?.activePromotions ?? [];

  if (loading)
    return (
      <div style={{ color: "#8888bb", padding: 24 }}>Cargando promos...</div>
    ); // Muestra todas las promos activas, pero marca cuáles aplican al carrito actual
  const activas = DB.promos.filter((p) => {
    if (!p.activa) return false;
    if (
      p.tipo === "por_tiempo" &&
      p.validHasta &&
      new Date(p.validHasta) < new Date()
    )
      return false;
    if (p.tipo === "por_stock" && p.stock !== null && p.stockUsado >= p.stock)
      return false;
    return true;
  });
  const idsPromoCarrito = new Set(
    DB.promosParaCarrito(carrito).map((p) => p.id),
  );
  const colores = { por_tiempo: "#FF6B35", por_stock: "#7C5CFC" };

  return (
    <div>
      <SectionTitle>Promociones activas ({activas.length})</SectionTitle>
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
      {activas.length === 0 && (
        <div style={S.emptyState}>😔 No hay promos activas ahora</div>
      )}
      <div style={S.grid2}>
        {activas.map((p) => {
          const color = colores[p.tipo] || "#FF6B35";
          const restante = p.stock ? p.stock - p.stockUsado : null;
          const aplicaAhora = carrito.length > 0 && idsPromoCarrito.has(p.id);
          const aplica =
            p.platosAplicables === null && p.categoriasAplicables === null
              ? "Aplica a todo el pedido"
              : `Aplica en: ${p.categoriasAplicables?.join(", ") || p.platosAplicables?.map((id) => DB.platos.find((pl) => pl.id === id)?.nombre).join(", ")}`;
          return (
            <div
              key={p.id}
              style={{
                ...S.promoCard,
                borderLeft: `4px solid ${color}`,
                position: "relative",
              }}
            >
              {aplicaAhora && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    fontSize: 11,
                    color: "#00C896",
                    fontWeight: 700,
                  }}
                >
                  ✅ Aplica a tu carrito
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={S.promoName}>{p.nombre}</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <span style={{ ...S.badge, background: color }}>
                    {p.tipo === "por_stock" ? "STOCK" : "TIEMPO"}
                  </span>
                  <span
                    style={{
                      ...S.badge,
                      background: p.scope === "global" ? "#00C896" : "#FF6B35",
                    }}
                  >
                    {p.scope.toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 4 }}>
                {p.desc}
              </div>
              <div style={{ fontSize: 11, color: "#6666aa", marginBottom: 6 }}>
                {aplica}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>
                {p.descuentoPct}% descuento
              </div>
              {restante !== null && (
                <div style={{ fontSize: 11, color: "#8888bb", marginTop: 4 }}>
                  Quedan {restante} unidades
                </div>
              )}
              {p.validHasta && (
                <div style={{ fontSize: 11, color: "#8888bb", marginTop: 4 }}>
                  Hasta: {p.validHasta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
