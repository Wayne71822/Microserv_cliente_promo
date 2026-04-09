import { useState } from "react";
import S from "../../styles/index.js";

export default function CarritoTab({
  carrito,
  onAgregar,
  onQuitar,
  onConfirmar,
}) {
  const [promoSel, setPromoSel] = useState(null);
  const [nota, setNota] = useState("");

  // Promos filtradas según los platos del carrito
  const promosDisponibles = DB.promosParaCarrito(carrito);

  const subtotal = carrito.reduce((a, i) => a + i.plato.precio * i.cantidad, 0);
  const descuento = DB.calcularDescuento(promoSel, carrito);
  const total = subtotal - descuento;

  // Si la promo seleccionada ya no aplica al carrito actual, limpiarla
  if (promoSel && !promosDisponibles.find((p) => p.id === promoSel.id)) {
    setPromoSel(null);
  }

  if (carrito.length === 0)
    return (
      <div>
        <SectionTitle>Mi carrito</SectionTitle>
        <div style={S.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          <div style={{ fontWeight: 600, color: "#e8e8f0", marginBottom: 6 }}>
            Tu carrito está vacío
          </div>
          <div style={{ fontSize: 13, color: "#8888bb" }}>
            Ve al menú y agrega platos
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <SectionTitle>
        Mi carrito ({carrito.reduce((a, i) => a + i.cantidad, 0)} items)
      </SectionTitle>

      {carrito.map((item) => (
        <div
          key={item.plato.id}
          style={{
            background: "#1a1a2e",
            border: "1px solid #2a2a4a",
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{item.plato.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>
                {item.plato.nombre}
              </div>
              <div style={{ fontSize: 13, color: "#FF6B35" }}>
                ${item.plato.precio.toFixed(2)} c/u
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={S.qtyBtn} onClick={() => onQuitar(item.plato.id)}>
                −
              </button>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#fff",
                  minWidth: 24,
                  textAlign: "center",
                }}
              >
                {item.cantidad}
              </span>
              <button style={S.qtyBtn} onClick={() => onAgregar(item.plato)}>
                +
              </button>
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#e8e8f0",
                minWidth: 60,
                textAlign: "right",
              }}
            >
              ${(item.plato.precio * item.cantidad).toFixed(2)}
            </div>
          </div>
        </div>
      ))}

      <label style={S.label}>Nota para cocina (opcional)</label>
      <textarea
        style={{
          ...S.input,
          height: 70,
          resize: "none",
          fontFamily: "inherit",
          marginBottom: 16,
        }}
        placeholder="Sin cebolla, alergia a nueces, etc."
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />

      {/* Promos filtradas por los productos en el carrito */}
      {promosDisponibles.length > 0 && (
        <>
          <label style={S.label}>Promociones disponibles para tu pedido</label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <button
              style={{
                ...S.roleBtn,
                ...(promoSel === null ? S.roleBtnActive : {}),
              }}
              onClick={() => setPromoSel(null)}
            >
              Sin promo
            </button>
            {promosDisponibles.map((p) => {
              const aplica =
                p.platosAplicables === null && p.categoriasAplicables === null
                  ? "todo el pedido"
                  : p.categoriasAplicables?.join(", ") ||
                    p.platosAplicables
                      ?.map(
                        (id) => DB.platos.find((pl) => pl.id === id)?.nombre,
                      )
                      .join(", ");
              return (
                <button
                  key={p.id}
                  style={{
                    ...S.roleBtn,
                    ...(promoSel?.id === p.id ? S.roleBtnActive : {}),
                  }}
                  onClick={() => setPromoSel(p)}
                >
                  🎁 {p.nombre} — {p.descuentoPct}% en {aplica}
                </button>
              );
            })}
          </div>
        </>
      )}

      {promosDisponibles.length === 0 && carrito.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: "#6666aa",
            marginBottom: 16,
            padding: "10px 14px",
            background: "#1a1a2e",
            borderRadius: 10,
          }}
        >
          💡 No hay promos disponibles para los platos seleccionados
        </div>
      )}

      {/* Resumen */}
      <div
        style={{
          background: "#1a1a2e",
          border: "1px solid #2a2a4a",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "#8888bb" }}>Subtotal</span>
          <span style={{ color: "#e8e8f0" }}>${subtotal.toFixed(2)}</span>
        </div>
        {descuento > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ color: "#00C896" }}>
              Descuento ({promoSel?.nombre})
            </span>
            <span style={{ color: "#00C896" }}>-${descuento.toFixed(2)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #2a2a4a",
            paddingTop: 10,
            marginTop: 4,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>
            Total
          </span>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#FF6B35" }}>
            ${total.toFixed(2)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#8888bb", marginTop: 8 }}>
          Ganarás ≈ <b style={{ color: "#FF6B35" }}>{Math.floor(total)} pts</b>{" "}
          con este pedido
        </div>
      </div>

      <button style={S.primaryBtn} onClick={() => onConfirmar(promoSel)}>
        Confirmar pedido → ${total.toFixed(2)}
      </button>
    </div>
  );
}
