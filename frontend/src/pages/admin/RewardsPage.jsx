import { useState } from "react";
import S from "../../styles/index.js";

export default function RewardsPage({ user, showToast }) {
  const recompensas = []; // ← se conectará cuando el backend lo tenga
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    emoji: "🎁",
    puntosReq: "",
    tipo: "cupon",
    desc: "",
    limiteXUsuario: "",
  });
  const [, force] = useState(0);
  const rf = () => force((n) => n + 1);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // todos los handlers de crear/editar/eliminar quedan así:
  //  const crear = () => showToast("Función pendiente de implementar", "err");
  //const toggle = () => showToast("Función pendiente de implementar", "err");
  // const eliminar = () => showToast("Función pendiente de implementar", "err");

  const crear = () => {
    if (!form.nombre || !form.puntosReq)
      return showToast("Nombre y puntos obligatorios", "err");
    DB.recompensas.push({
      id: "R" + Date.now(),
      nombre: form.nombre,
      emoji: form.emoji,
      puntosReq: parseInt(form.puntosReq),
      tipo: form.tipo,
      desc: form.desc,
      limiteXUsuario: form.limiteXUsuario
        ? parseInt(form.limiteXUsuario)
        : null,
      activa: true,
    });
    setCreando(false);
    setForm({
      nombre: "",
      emoji: "🎁",
      puntosReq: "",
      tipo: "cupon",
      desc: "",
      limiteXUsuario: "",
    });
    rf();
    showToast("Recompensa creada");
  };

  const guardarEdicion = (id, cambios) => {
    const idx = DB.recompensas.findIndex((r) => r.id === id);
    Object.assign(DB.recompensas[idx], cambios);
    rf();
    setEditando(null);
    showToast("Recompensa actualizada");
  };
  const toggle = (id) => {
    const r = DB.recompensas.find((r) => r.id === id);
    r.activa = !r.activa;
    rf();
    showToast(`Recompensa ${r.activa ? "activada" : "desactivada"}`);
  };
  const eliminar = (id) => {
    const i = DB.recompensas.findIndex((r) => r.id === id);
    DB.recompensas.splice(i, 1);
    rf();
    showToast("Recompensa eliminada");
  };

  return (
    <div>
      <div
        style={{
          background: "rgba(255,215,0,0.05)",
          border: "1px solid rgba(255,215,0,0.2)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#FFD700",
            marginBottom: 4,
          }}
        >
          ⭐ Gestión del programa de puntos
        </div>
        <div style={{ fontSize: 13, color: "#8888bb" }}>
          Crea y edita recompensas, define cuántos puntos cuestan y límites por
          cliente.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SectionTitle>Recompensas ({DB.recompensas.length})</SectionTitle>
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
          {creando ? "Cancelar" : "+ Nueva recompensa"}
        </button>
      </div>

      {creando && (
        <div style={{ ...S.formCard, marginBottom: 16 }}>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Emoji</label>
              <input
                style={S.input}
                value={form.emoji}
                onChange={(e) => set("emoji", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Nombre</label>
              <input
                style={S.input}
                placeholder="Bebida gratis"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Tipo</label>
              <select
                style={S.select}
                value={form.tipo}
                onChange={(e) => set("tipo", e.target.value)}
              >
                <option value="cupon">Cupón de descuento</option>
                <option value="producto">Producto gratis</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Puntos requeridos</label>
              <input
                style={S.input}
                type="number"
                min="1"
                placeholder="Ej: 100"
                value={form.puntosReq}
                onChange={(e) => set("puntosReq", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Límite/usuario (vacío = sin límite)</label>
              <input
                style={S.input}
                type="number"
                min="1"
                placeholder="Ej: 3"
                value={form.limiteXUsuario}
                onChange={(e) => set("limiteXUsuario", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Descripción</label>
              <input
                style={S.input}
                placeholder="Descripción"
                value={form.desc}
                onChange={(e) => set("desc", e.target.value)}
              />
            </div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={crear}>
            Crear recompensa
          </button>
        </div>
      )}

      {DB.recompensas.map((r) => {
        const totalCanjes = DB.usuarios.reduce(
          (a, u) =>
            a +
            (u.cuponesCanjeados || []).filter((c) => c.recompensaId === r.id)
              .length,
          0,
        );
        return (
          <div
            key={r.id}
            style={{
              ...S.formCard,
              marginBottom: 10,
              opacity: r.activa ? 1 : 0.55,
            }}
          >
            {editando !== r.id ? (
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
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
                    style={{ fontSize: 12, color: "#8888bb", marginBottom: 4 }}
                  >
                    {r.desc}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ ...S.badge, background: "#FF6B35" }}>
                      {r.puntosReq} pts
                    </span>
                    <span
                      style={{
                        ...S.badge,
                        background: r.tipo === "cupon" ? "#7C5CFC" : "#00C896",
                      }}
                    >
                      {r.tipo.toUpperCase()}
                    </span>
                    {r.limiteXUsuario !== null && (
                      <span style={{ ...S.badge, background: "#333366" }}>
                        Límite: {r.limiteXUsuario}/usuario
                      </span>
                    )}
                    <span style={{ ...S.badge, background: "#333333" }}>
                      Canjeada {totalCanjes}x
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button style={S.adminBtn} onClick={() => setEditando(r.id)}>
                    ✏️
                  </button>
                  <button
                    style={{
                      ...S.adminBtn,
                      background: r.activa
                        ? "rgba(255,107,107,0.15)"
                        : "rgba(0,200,150,0.15)",
                      color: r.activa ? "#FF6B6B" : "#00C896",
                    }}
                    onClick={() => toggle(r.id)}
                  >
                    {r.activa ? "🔴" : "🟢"}
                  </button>
                  <button
                    style={{
                      ...S.adminBtn,
                      background: "rgba(255,107,107,0.1)",
                      color: "#FF6B6B",
                    }}
                    onClick={() => eliminar(r.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ) : (
              <EditRecompensaForm
                recompensa={r}
                onSave={(c) => guardarEdicion(r.id, c)}
                onCancel={() => setEditando(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditRecompensaForm({ recompensa, onSave, onCancel }) {
  const [f, setF] = useState({
    nombre: recompensa.nombre,
    emoji: recompensa.emoji,
    puntosReq: recompensa.puntosReq,
    tipo: recompensa.tipo,
    desc: recompensa.desc,
    limiteXUsuario: recompensa.limiteXUsuario ?? "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Emoji</label>
          <input
            style={S.input}
            value={f.emoji}
            onChange={(e) => set("emoji", e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>Nombre</label>
          <input
            style={S.input}
            value={f.nombre}
            onChange={(e) => set("nombre", e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>Puntos requeridos</label>
          <input
            style={S.input}
            type="number"
            value={f.puntosReq}
            onChange={(e) => set("puntosReq", e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>Tipo</label>
          <select
            style={S.select}
            value={f.tipo}
            onChange={(e) => set("tipo", e.target.value)}
          >
            <option value="cupon">Cupón</option>
            <option value="producto">Producto</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Límite/usuario</label>
          <input
            style={S.input}
            type="number"
            value={f.limiteXUsuario}
            onChange={(e) => set("limiteXUsuario", e.target.value)}
          />
        </div>
        <div>
          <label style={S.label}>Descripción</label>
          <input
            style={S.input}
            value={f.desc}
            onChange={(e) => set("desc", e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          style={{ ...S.primaryBtn, marginTop: 0, flex: 1 }}
          onClick={() =>
            onSave({
              ...f,
              puntosReq: parseInt(f.puntosReq),
              limiteXUsuario: f.limiteXUsuario
                ? parseInt(f.limiteXUsuario)
                : null,
            })
          }
        >
          Guardar
        </button>
        <button
          style={{ ...S.dangerBtn, marginTop: 0, flex: 0.4 }}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
