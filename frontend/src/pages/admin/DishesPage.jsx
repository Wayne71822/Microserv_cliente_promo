import { useState } from "react";
import S from "../../styles/index.js";
export default function AdminPlatos({ showToast }) {
  const [agregando, setAgregando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [verReseñas, setVerReseñas] = useState(null);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    emoji: "🍽️",
    precio: "",
    categoria: "",
  });
  const [, force] = useState(0);
  const rf = () => force((n) => n + 1);

  const toggleActivo = (id) => {
    const p = DB.platos.find((p) => p.id === id);
    p.activo = !p.activo;
    rf();
    showToast(`Plato ${p.activo ? "activado" : "desactivado"}`);
  };
  const guardar = (id, cambios) => {
    const idx = DB.platos.findIndex((p) => p.id === id);
    Object.assign(DB.platos[idx], cambios);
    rf();
    setEditando(null);
    showToast("Plato actualizado");
  };
  const agregar = () => {
    if (!nuevo.nombre || !nuevo.precio)
      return showToast("Nombre y precio obligatorios", "err");
    DB.platos.push({
      id: "D" + Date.now(),
      ...nuevo,
      precio: parseFloat(nuevo.precio),
      activo: true,
      reseñas: [],
      platosAplicables: null,
    });
    setNuevo({ nombre: "", emoji: "🍽️", precio: "", categoria: "" });
    setAgregando(false);
    rf();
    showToast("Plato agregado");
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SectionTitle>Platos ({DB.platos.length})</SectionTitle>
        <button
          style={{
            ...S.primaryBtn,
            width: "auto",
            padding: "10px 18px",
            marginTop: 24,
            fontSize: 13,
          }}
          onClick={() => setAgregando(!agregando)}
        >
          {agregando ? "Cancelar" : "+ Agregar"}
        </button>
      </div>

      {agregando && (
        <div style={{ ...S.formCard, marginBottom: 16 }}>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Emoji</label>
              <input
                style={S.input}
                value={nuevo.emoji}
                onChange={(e) =>
                  setNuevo((p) => ({ ...p, emoji: e.target.value }))
                }
              />
            </div>
            <div>
              <label style={S.label}>Nombre</label>
              <input
                style={S.input}
                value={nuevo.nombre}
                onChange={(e) =>
                  setNuevo((p) => ({ ...p, nombre: e.target.value }))
                }
              />
            </div>
            <div>
              <label style={S.label}>Precio</label>
              <input
                style={S.input}
                type="number"
                value={nuevo.precio}
                onChange={(e) =>
                  setNuevo((p) => ({ ...p, precio: e.target.value }))
                }
              />
            </div>
            <div>
              <label style={S.label}>Categoría</label>
              <input
                style={S.input}
                value={nuevo.categoria}
                onChange={(e) =>
                  setNuevo((p) => ({ ...p, categoria: e.target.value }))
                }
              />
            </div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={agregar}>
            Agregar plato
          </button>
        </div>
      )}

      {verReseñas && (
        <div style={S.modalOverlay} onClick={() => setVerReseñas(null)}>
          <div
            style={{ ...S.modal, maxWidth: 500, textAlign: "left" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 36 }}>{verReseñas.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>
                  {verReseñas.nombre}
                </div>
                <div style={{ fontSize: 13, color: "#8888bb" }}>
                  {verReseñas.reseñas.length} reseñas · Promedio:{" "}
                  {DB.getRating(verReseñas.id) || "—"} ⭐
                </div>
              </div>
            </div>
            {verReseñas.reseñas.length === 0 && (
              <div style={S.emptyState}>Sin reseñas</div>
            )}
            {verReseñas.reseñas.map((r, i) => (
              <div
                key={i}
                style={{ padding: "12px 0", borderBottom: "1px solid #1e1e3a" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, fontSize: 13, color: "#e8e8f0" }}
                  >
                    👤 {r.userName}
                  </div>
                  <div style={{ color: "#FFD700", fontSize: 14 }}>
                    {"⭐".repeat(r.stars)}
                  </div>
                </div>
                {r.comentario && (
                  <div
                    style={{ fontSize: 13, color: "#aaaacc", marginBottom: 2 }}
                  >
                    "{r.comentario}"
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#6666aa" }}>{r.fecha}</div>
              </div>
            ))}
            <button
              style={{
                background: "none",
                border: "1px solid #2a2a4a",
                color: "#8888bb",
                borderRadius: 10,
                padding: "10px 20px",
                cursor: "pointer",
                marginTop: 16,
                width: "100%",
                fontSize: 13,
              }}
              onClick={() => setVerReseñas(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {DB.platos.map((plato) => {
        const rating = DB.getRating(plato.id);
        return (
          <div
            key={plato.id}
            style={{
              ...S.formCard,
              marginBottom: 10,
              opacity: plato.activo ? 1 : 0.55,
            }}
          >
            {editando !== plato.id ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 26 }}>{plato.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.dishName}>{plato.nombre}</div>
                  <div style={{ fontSize: 12, color: "#8888bb" }}>
                    ${plato.precio.toFixed(2)} · {plato.categoria}
                    {rating ? ` · ⭐ ${rating}` : ""} · {plato.reseñas.length}{" "}
                    reseñas
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={S.adminBtn}
                    onClick={() => setVerReseñas(plato)}
                  >
                    💬
                  </button>
                  <button
                    style={S.adminBtn}
                    onClick={() => setEditando(plato.id)}
                  >
                    ✏️
                  </button>
                  <button
                    style={{
                      ...S.adminBtn,
                      background: plato.activo
                        ? "rgba(255,107,107,0.15)"
                        : "rgba(0,200,150,0.15)",
                      color: plato.activo ? "#FF6B6B" : "#00C896",
                    }}
                    onClick={() => toggleActivo(plato.id)}
                  >
                    {plato.activo ? "🔴" : "🟢"}
                  </button>
                </div>
              </div>
            ) : (
              <EditPlatoForm
                plato={plato}
                onSave={(c) => guardar(plato.id, c)}
                onCancel={() => setEditando(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditPlatoForm({ plato, onSave, onCancel }) {
  const [f, setF] = useState({
    nombre: plato.nombre,
    emoji: plato.emoji,
    precio: plato.precio,
    categoria: plato.categoria,
  });
  return (
    <div>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Emoji</label>
          <input
            style={S.input}
            value={f.emoji}
            onChange={(e) => setF((p) => ({ ...p, emoji: e.target.value }))}
          />
        </div>
        <div>
          <label style={S.label}>Nombre</label>
          <input
            style={S.input}
            value={f.nombre}
            onChange={(e) => setF((p) => ({ ...p, nombre: e.target.value }))}
          />
        </div>
        <div>
          <label style={S.label}>Precio</label>
          <input
            style={S.input}
            type="number"
            value={f.precio}
            onChange={(e) => setF((p) => ({ ...p, precio: e.target.value }))}
          />
        </div>
        <div>
          <label style={S.label}>Categoría</label>
          <input
            style={S.input}
            value={f.categoria}
            onChange={(e) => setF((p) => ({ ...p, categoria: e.target.value }))}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          style={{ ...S.primaryBtn, marginTop: 0, flex: 1 }}
          onClick={() => onSave({ ...f, precio: parseFloat(f.precio) })}
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
