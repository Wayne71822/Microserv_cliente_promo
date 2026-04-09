import { useState } from "react";
import S from "../../styles/index.js";

// ─── PERFIL (sin campo teléfono) ──────────────────────────────────────────────
export default function ProfileTab({
  user,
  onLogout,
  updateUser,
  showToast,
  isAdmin,
}) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    country: user?.country || "",
    restaurant: user?.restaurant || "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const guardar = () => {
    if (!form.name.trim()) return showToast("Nombre vacío", "err");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return showToast("Email inválido", "err");
    const cambios = {
      name: form.name,
      email: form.email,
      country: form.country,
      restaurant: form.restaurant,
    };
    if (form.password.length > 0) {
      if (form.password.length < 6)
        return showToast("Contraseña mínimo 6 caracteres", "err");
      cambios.password = form.password;
    }
    updateUser(cambios);
    setEditando(false);
    showToast("Perfil actualizado");
  };

  return (
    <div>
      <div style={S.profileHeader}>
        <div style={S.avatar}>{(user?.name || "U")[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 12, color: "#8888bb", marginTop: 3 }}>
            {user?.email}
          </div>
          <span
            style={{
              ...S.badge,
              background: isAdmin ? "#7C5CFC" : "#00C896",
              display: "inline-block",
              marginTop: 6,
            }}
          >
            {user?.role?.toUpperCase()}
          </span>
        </div>
        <button
          style={{
            background: "none",
            border: "1px solid #2a2a4a",
            color: "#8888bb",
            borderRadius: 10,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 13,
          }}
          onClick={() => setEditando(!editando)}
        >
          {editando ? "Cancelar" : "✏️ Editar"}
        </button>
      </div>

      {editando && (
        <div style={{ ...S.formCard, marginTop: 16 }}>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Nombre</label>
              <input
                style={S.input}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input
                style={S.input}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Nueva contraseña</label>
              <input
                style={S.input}
                type="password"
                placeholder="Dejar vacío para no cambiar"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>País</label>
              <select
                style={S.select}
                value={form.country}
                onChange={(e) => {
                  set("country", e.target.value);
                  set("restaurant", "");
                }}
              >
                <option value="">Selecciona...</option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Restaurante</label>
              <select
                style={S.select}
                value={form.restaurant}
                onChange={(e) => set("restaurant", e.target.value)}
              >
                <option value="">Selecciona...</option>
                {(RESTAURANTS[form.country] || []).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 16 }} onClick={guardar}>
            Guardar cambios
          </button>
        </div>
      )}

      <SectionTitle>Mi información</SectionTitle>
      {[
        { label: "País", value: user?.country || "—", icon: "🌍" },
        { label: "Restaurante", value: user?.restaurant || "—", icon: "🏪" },
        ...(!isAdmin
          ? [
              {
                label: "Puntos",
                value: `${(user?.points || 0).toLocaleString()} pts`,
                icon: "⭐",
              },
            ]
          : []),
      ].map((row) => (
        <div key={row.label} style={S.infoRow}>
          <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>
            {row.icon}
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: "#6666aa",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#e8e8f0",
                marginTop: 2,
                fontWeight: 600,
              }}
            >
              {row.value}
            </div>
          </div>
        </div>
      ))}
      <button style={S.dangerBtn} onClick={onLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}
