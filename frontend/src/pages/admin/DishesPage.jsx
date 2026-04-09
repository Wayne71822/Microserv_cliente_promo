import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import S from "../../styles/index.js";
import { GET_ALL_DISHES, CREATE_DISH, UPDATE_DISH } from "../../api/graphql.js";

export default function DishesPage({ showToast }) {
  const { data, loading, error } = useQuery(GET_ALL_DISHES);
  const [editando, setEditando] = useState(null);
  const [nuevo, setNuevo] = useState(false);

  // Mutaciones
  const [crearPlato] = useMutation(CREATE_DISH, { refetchQueries: [{ query: GET_ALL_DISHES }] });
  const [actualizarPlato] = useMutation(UPDATE_DISH, { refetchQueries: [{ query: GET_ALL_DISHES }] });

  if (loading) return <div style={{ color: "white" }}>Cargando menú...</div>;

  const handleToggleActivo = async (plato) => {
    try {
      await actualizarPlato({
        variables: {
          id: plato.id,
          input: { active: !plato.active }
        }
      });
      showToast(`Plato ${!plato.active ? "activado" : "desactivado"}`);
    } catch (err) {
      showToast("Error al cambiar estado", "err");
    }
  };

  const handleSave = async (f) => {
    try {
      const input = {
        name: f.name || f.nombre,
        price: parseFloat(f.price || f.precio),
        category: f.category || f.categoria,
        emoji: f.emoji,
        active: f.active ?? true
      };

      if (f.id) {
        await actualizarPlato({ variables: { id: f.id, input } });
        showToast("Plato actualizado");
      } else {
        await crearPlato({ variables: { input } });
        showToast("Plato creado con éxito");
      }
      setEditando(null);
      setNuevo(false);
    } catch (err) {
      showToast("Error al guardar en el servidor", "err");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "white" }}>Gestión de Platos</h2>
        <button style={S.primaryBtn} onClick={() => {
          setEditando({ name: "", emoji: "🍔", price: "", category: "General" });
          setNuevo(true);
        }}>
          + Nuevo Plato
        </button>
      </div>

      <div style={S.grid}>
        {data?.allDishes.map((p) => (
          <div key={p.id} style={{ ...S.card, opacity: p.active ? 1 : 0.5 }}>
            <div style={{ fontSize: 32 }}>{p.emoji}</div>
            <div style={{ fontWeight: 700, color: "white", marginTop: 8 }}>{p.name || p.nombre}</div>
            <div style={{ color: "#FF6B35" }}>${p.price || p.precio}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
              <button style={S.secondaryBtn} onClick={() => setEditando(p)}>Editar</button>
              <button
                style={{ ...S.rateBtn, background: p.active ? "#ff4444" : "#00C896" }}
                onClick={() => handleToggleActivo(p)}
              >
                {p.active ? "Pausar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {(editando || nuevo) && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={{ color: "white" }}>{nuevo ? "Agregar" : "Editar"} Plato</h3>
            <input
              style={S.input}
              placeholder="Nombre"
              value={editando.name || editando.nombre}
              onChange={e => setEditando({ ...editando, name: e.target.value })}
            />
            <input
              style={S.input}
              type="number"
              placeholder="Precio"
              value={editando.price || editando.precio}
              onChange={e => setEditando({ ...editando, price: e.target.value })}
            />
            <input
              style={S.input}
              placeholder="Categoría"
              value={editando.category || editando.categoria}
              onChange={e => setEditando({ ...editando, category: e.target.value })}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={S.primaryBtn} onClick={() => handleSave(editando)}>Guardar</button>
              <button style={S.secondaryBtn} onClick={() => { setEditando(null); setNuevo(false); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}