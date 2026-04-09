import { useState } from "react";
import S from "../../styles/index.js";
import { useQuery, useMutation } from "@apollo/client";
// Importar las queries/mutaciones correspondientes de tu archivo de API
import {
  GET_ALL_REWARDS,
  CREATE_REWARD,
  UPDATE_REWARD,
  DELETE_REWARD
} from "../../api/graphql.js";

const SectionTitle = ({ children }) => (
  <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 16, marginTop: 24, fontWeight: 700 }}>
    {children}
  </h2>
);

export default function RewardsPage({ user, showToast }) {
  // 1. Datos del Servidor
  const { data, loading, error } = useQuery(GET_ALL_REWARDS);

  // 2. Mutaciones
  const [createReward] = useMutation(CREATE_REWARD, { refetchQueries: [{ query: GET_ALL_REWARDS }] });
  const [updateReward] = useMutation(UPDATE_REWARD, { refetchQueries: [{ query: GET_ALL_REWARDS }] });
  const [deleteReward] = useMutation(DELETE_REWARD, { refetchQueries: [{ query: GET_ALL_REWARDS }] });

  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    emoji: "🎁",
    puntosReq: "",
    tipo: "CUPON",
    desc: "",
    limiteXUsuario: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleCrear = async () => {
    if (!form.nombre || !form.puntosReq)
      return showToast("Nombre y puntos obligatorios", "err");

    try {
      await createReward({
        variables: {
          input: {
            name: form.nombre,
            emoji: form.emoji,
            pointsRequired: parseInt(form.puntosReq),
            type: form.tipo,
            description: form.desc,
            userLimit: form.limiteXUsuario ? parseInt(form.limiteXUsuario) : null,
            isActive: true
          }
        }
      });
      setCreando(false);
      setForm({ nombre: "", emoji: "🎁", puntosReq: "", tipo: "CUPON", desc: "", limiteXUsuario: "" });
      showToast("Recompensa creada");
    } catch (err) {
      showToast("Error al crear recompensa", "err");
    }
  };

  const handleToggle = async (recompensa) => {
    try {
      await updateReward({
        variables: {
          id: recompensa.id,
          input: { isActive: !recompensa.isActive }
        }
      });
      showToast(`Recompensa ${!recompensa.isActive ? "activada" : "desactivada"}`);
    } catch (err) {
      showToast("Error al actualizar estado", "err");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta recompensa?")) return;
    try {
      await deleteReward({ variables: { id } });
      showToast("Recompensa eliminada");
    } catch (err) {
      showToast("Error al eliminar", "err");
    }
  };

  if (loading) return <div style={{ color: "white", padding: 20 }}>Cargando gestión de puntos...</div>;

  const recompensas = data?.allRewards || [];

  return (
    <div>
      <div style={{
        background: "rgba(255,215,0,0.05)",
        border: "1px solid rgba(255,215,0,0.2)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 8,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#FFD700", marginBottom: 4 }}>
          ⭐ Gestión del programa de puntos
        </div>
        <div style={{ fontSize: 13, color: "#8888bb" }}>
          Define recompensas, costos en puntos y límites por cliente.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionTitle>Recompensas ({recompensas.length})</SectionTitle>
        <button
          style={{ ...S.primaryBtn, width: "auto", padding: "10px 18px", marginTop: 24, fontSize: 13 }}
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
              <input style={S.input} value={form.emoji} onChange={(e) => set("emoji", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Nombre</label>
              <input style={S.input} placeholder="Bebida gratis" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Tipo</label>
              <select style={S.select} value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                <option value="CUPON">Cupón de descuento</option>
                <option value="PRODUCTO">Producto gratis</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Puntos requeridos</label>
              <input style={S.input} type="number" placeholder="100" value={form.puntosReq} onChange={(e) => set("puntosReq", e.target.value)} />
            </div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={handleCrear}>Crear recompensa</button>
        </div>
      )}

      {recompensas.map((r) => (
        <div key={r.id} style={{ ...S.formCard, marginBottom: 10, opacity: r.isActive ? 1 : 0.55 }}>
          {editando !== r.id ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4 }}>{r.name || r.nombre}</div>
                <div style={{ fontSize: 12, color: "#8888bb", marginBottom: 4 }}>{r.description || r.desc}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ ...S.badge, background: "#FF6B35" }}>{r.pointsRequired || r.puntosReq} pts</span>
                  <span style={{ ...S.badge, background: r.type === "CUPON" ? "#7C5CFC" : "#00C896" }}>
                    {(r.type || "CUPON").toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={S.adminBtn} onClick={() => setEditando(r.id)}>✏️</button>
                <button
                  style={{ ...S.adminBtn, color: r.isActive ? "#FF6B6B" : "#00C896" }}
                  onClick={() => handleToggle(r)}
                >
                  {r.isActive ? "🔴" : "🟢"}
                </button>
                <button style={S.adminBtn} onClick={() => handleEliminar(r.id)}>🗑️</button>
              </div>
            </div>
          ) : (
            <EditRecompensaForm
              recompensa={r}
              onSave={async (cambios) => {
                try {
                  await updateReward({ variables: { id: r.id, input: cambios } });
                  setEditando(null);
                  showToast("Actualizado correctamente");
                } catch (e) { showToast("Error al editar", "err"); }
              }}
              onCancel={() => setEditando(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function EditRecompensaForm({ recompensa, onSave, onCancel }) {
  const [f, setF] = useState({
    name: recompensa.name || recompensa.nombre,
    emoji: recompensa.emoji,
    pointsRequired: recompensa.pointsRequired || recompensa.puntosReq,
    type: recompensa.type || recompensa.tipo,
    description: recompensa.description || recompensa.desc,
    userLimit: recompensa.userLimit || recompensa.limiteXUsuario || "",
  });

  return (
    <div>
      <div style={S.grid2}>
        <input style={S.input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Nombre" />
        <input style={S.input} type="number" value={f.pointsRequired} onChange={e => setF({ ...f, pointsRequired: parseInt(e.target.value) })} placeholder="Puntos" />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button style={{ ...S.primaryBtn, flex: 1 }} onClick={() => onSave(f)}>Guardar</button>
        <button style={{ ...S.dangerBtn, flex: 0.4 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}