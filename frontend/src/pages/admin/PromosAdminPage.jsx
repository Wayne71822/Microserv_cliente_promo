import { useState } from "react";
import S from "../../styles/index.js";
import { useActivePromotions, useCreatePromotion } from "../../api/hooks.js";

export default function PromosAdminPage({ user, showToast }) {
  const { data, loading, refetch } = useActivePromotions(user?.id, null);
  const [createPromotion] = useCreatePromotion(user?.id);
  const promos = data?.activePromotions ?? [];

  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    desc: "",
    tipo: "POR_TIEMPO", // ← ojo: el backend usa mayúsculas por el enum
    scope: "GLOBAL", // ← igual
    descuentoPct: "",
    validHasta: "",
    stock: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const crear = async () => {
    if (!form.nombre || !form.descuentoPct)
      return showToast("Nombre y descuento obligatorios", "err");

    try {
      await createPromotion({
        variables: {
          id: "P-" + Date.now(),
          name: form.nombre,
          description: form.desc,
          scope: form.scope,
          promoType: form.tipo,
          validFrom: new Date().toISOString(),
          discountPct: parseFloat(form.descuentoPct),
          validUntil: form.validHasta
            ? new Date(form.validHasta).toISOString()
            : null,
          stockLimit: form.stock ? parseInt(form.stock) : null,
        },
      });
      await refetch();
      setCreando(false);
      setForm({
        nombre: "",
        desc: "",
        tipo: "POR_TIEMPO",
        scope: "GLOBAL",
        descuentoPct: "",
        validHasta: "",
        stock: "",
      });
      showToast("Promo creada");
    } catch (e) {
      console.error(e);
      showToast("Error al crear la promo", "err");
    }
  };

  if (loading)
    return <div style={{ color: "#8888bb", padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SectionTitle>Promos ({DB.promos.length})</SectionTitle>
        <button
          style={{
            ...S.primaryBtn,
            width: "auto",
            padding: "10px 18px",
            marginTop: 24,
            fontSize: 13,
          }}
          onClick={() => setCreando(!creando)}
        >
          {creando ? "Cancelar" : "+ Nueva promo"}
        </button>
      </div>

      {creando && (
        <div style={{ ...S.formCard, marginBottom: 16 }}>
          <label style={S.label}>Nombre</label>
          <input
            style={S.input}
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
          />
          <label style={S.label}>Descripción</label>
          <input
            style={S.input}
            value={form.desc}
            onChange={(e) => set("desc", e.target.value)}
          />
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Tipo</label>
              <select
                style={S.select}
                value={form.tipo}
                onChange={(e) => set("tipo", e.target.value)}
              >
                <option value="por_tiempo">Por tiempo</option>
                <option value="por_stock">Por stock</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Alcance</label>
              <select
                style={S.select}
                value={form.scope}
                onChange={(e) => set("scope", e.target.value)}
              >
                <option value="global">Global</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Descuento (%)</label>
              <input
                style={S.input}
                type="number"
                min="1"
                max="100"
                value={form.descuentoPct}
                onChange={(e) => set("descuentoPct", e.target.value)}
              />
            </div>
            {form.tipo === "por_tiempo" && (
              <div>
                <label style={S.label}>Válida hasta</label>
                <input
                  style={S.input}
                  type="date"
                  value={form.validHasta}
                  onChange={(e) => set("validHasta", e.target.value)}
                />
              </div>
            )}
            {form.tipo === "por_stock" && (
              <div>
                <label style={S.label}>Unidades</label>
                <input
                  style={S.input}
                  type="number"
                  min="1"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                />
              </div>
            )}
            <div>
              <label style={S.label}>
                Categorías que aplica (vacío = todas)
              </label>
              <input
                style={S.input}
                placeholder="Ej: Pasta, Bebidas"
                value={form.categorias}
                onChange={(e) => set("categorias", e.target.value)}
              />
            </div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={crear}>
            Crear promo
          </button>
        </div>
      )}

      {DB.promos.map((p) => {
        const c = p.tipo === "por_stock" ? "#7C5CFC" : "#FF6B35";
        const aplica =
          p.platosAplicables === null && p.categoriasAplicables === null
            ? "Todo el pedido"
            : p.categoriasAplicables?.join(", ") || "platos específicos";
        return (
          <div
            key={p.id}
            style={{
              ...S.formCard,
              marginBottom: 10,
              borderLeft: `4px solid ${c}`,
              opacity: p.activa ? 1 : 0.5,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span style={S.promoName}>{p.nombre}</span>
                  <span style={{ ...S.badge, background: c }}>
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
                <div
                  style={{ fontSize: 13, color: "#aaaacc", marginBottom: 4 }}
                >
                  {p.desc}
                </div>
                <div
                  style={{ fontSize: 12, color: "#6666aa", marginBottom: 4 }}
                >
                  Aplica en: {aplica}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c }}>
                  -{p.descuentoPct}%
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexShrink: 0,
                  marginLeft: 10,
                }}
              >
                <button
                  style={{
                    ...S.adminBtn,
                    background: p.activa
                      ? "rgba(255,107,107,0.15)"
                      : "rgba(0,200,150,0.15)",
                    color: p.activa ? "#FF6B6B" : "#00C896",
                  }}
                  onClick={() =>
                    showToast("Función pendiente de implementar", "err")
                  }
                >
                  {p.activa ? "Desactivar" : "Activar"}
                </button>
                <button
                  style={{
                    ...S.adminBtn,
                    background: "rgba(255,107,107,0.1)",
                    color: "#FF6B6B",
                  }}
                  onClick={() =>
                    showToast("Función pendiente de implementar", "err")
                  }
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
