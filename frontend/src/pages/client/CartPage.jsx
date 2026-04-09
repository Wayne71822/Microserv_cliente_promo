import { useState, useMemo } from "react";
import S from "../../styles/index.js";
import { useActivePromotions } from "../../api/hooks.js"; // Corregido el nivel de ruta

export default function CarritoTab({ user, carrito, onAgregar, onQuitar, onConfirmar }) {
  const [promoSel, setPromoSel] = useState(null);
  const [nota, setNota] = useState("");

  // Usar el hook real en lugar de DB
  const { data: promoData } = useActivePromotions(user?.preferredRestaurantId);
  const todasLasPromos = promoData?.activePromotions || [];

  // Filtro de promos (Lógica local)
  const promosDisponibles = useMemo(() => {
    return todasLasPromos.filter(p => {
      if (!p.applicableCategories && !p.applicableDishes) return true;
      return carrito.some(item =>
        p.applicableCategories?.includes(item.plato.category) ||
        p.applicableDishes?.includes(item.plato.id)
      );
    });
  }, [todasLasPromos, carrito]);

  const subtotal = carrito.reduce((a, i) => a + (i.plato.price || i.plato.precio) * i.cantidad, 0);

  const descuento = useMemo(() => {
    if (!promoSel) return 0;
    return (subtotal * (promoSel.discountPct || 0)) / 100;
  }, [promoSel, subtotal]);

  const total = subtotal - descuento;

  if (carrito.length === 0) return (
    <div>
      <div style={S.sectionTitle}>Mi carrito</div>
      <div style={S.emptyState}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
        <div style={{ fontWeight: 600, color: "#e8e8f0" }}>Tu carrito está vacío</div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={S.sectionTitle}>Mi carrito ({carrito.length} tipos de platos)</div>

      {carrito.map((item) => (
        <div key={item.plato.id} style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{item.plato.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#e8e8f0" }}>{item.plato.name || item.plato.nombre}</div>
              <div style={{ fontSize: 13, color: "#FF6B35" }}>${(item.plato.price || item.plato.precio).toFixed(2)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={S.qtyBtn} onClick={() => onQuitar(item.plato.id)}>−</button>
              <span style={{ fontWeight: 700, color: "#fff" }}>{item.cantidad}</span>
              <button style={S.qtyBtn} onClick={() => onAgregar(item.plato)}>+</button>
            </div>
          </div>
        </div>
      ))}

      <label style={S.label}>Nota para cocina</label>
      <textarea
        style={{ ...S.input, height: 60, marginBottom: 16 }}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Instrucciones especiales..."
      />

      {promosDisponibles.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Promociones Aplicables</label>
          {promosDisponibles.map(p => (
            <button
              key={p.id}
              style={{ ...S.roleBtn, ...(promoSel?.id === p.id ? S.roleBtnActive : {}), marginBottom: 5 }}
              onClick={() => setPromoSel(p)}
            >
              🎁 {p.name || p.nombre} (-{p.discountPct}%)
            </button>
          ))}
        </div>
      )}

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#8888bb" }}>
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {descuento > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#00C896" }}>
            <span>Descuento</span>
            <span>-${descuento.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, borderTop: "1px solid #2a2a4a", paddingTop: 10 }}>
          <span style={{ fontWeight: 700, color: "#fff" }}>Total</span>
          <span style={{ fontWeight: 800, color: "#FF6B35", fontSize: 20 }}>${total.toFixed(2)}</span>
        </div>
      </div>

      <button style={S.primaryBtn} onClick={() => onConfirmar(promoSel, nota)}>
        Confirmar pedido
      </button>
    </div>
  );
}