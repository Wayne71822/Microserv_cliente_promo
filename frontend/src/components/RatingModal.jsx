import { useState } from "react";
// Corregido: un solo nivel hacia atrás si styles está en src/styles
import S from "../styles/index.js";
import { useRateDish } from "../api/hooks.js";

export default function RatingModal({ plato, onRate, onClose, customerId, yaReseñó, rating }) {
  const [stars, setStars] = useState(0);
  const [comentario, setComentario] = useState("");
  const [rateDish, { loading }] = useRateDish(customerId);

  const handleSubmit = async () => {
    if (!stars || loading) return;
    try {
      await rateDish({
        variables: {
          dishId: plato.id,
          stars,
          comment: comentario || null,
        },
      });
      // Notifica al padre para cerrar el modal y mostrar feedback
      onRate(plato.id, stars, comentario);
    } catch (e) {
      console.error("Error al enviar calificación:", e);
    }
  };

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{plato.emoji || "🍽️"}</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          {plato.nombre || plato.name}
        </div>

        {rating && (
          <div style={{ fontSize: 13, color: "#8888bb", marginBottom: 16 }}>
            Valoración actual: ⭐ {rating}
          </div>
        )}

        {yaReseñó ? (
          <div style={{ fontSize: 14, color: "#8888bb", padding: "16px 0" }}>
            ✅ Ya enviaste tu valoración para este plato.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    transform: stars >= s ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.1s",
                  }}
                  onClick={() => setStars(s)}
                  disabled={loading}
                >
                  <span style={{ fontSize: 34, opacity: s <= stars ? 1 : 0.2 }}>
                    ⭐
                  </span>
                </button>
              ))}
            </div>
            <textarea
              style={{
                ...S.input,
                height: 80,
                resize: "none",
                fontFamily: "inherit",
              }}
              placeholder="Comentario opcional..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              disabled={loading}
            />
            <button
              style={{
                ...S.primaryBtn,
                opacity: (stars === 0 || loading) ? 0.4 : 1,
                marginTop: 12,
                cursor: (stars === 0 || loading) ? "not-allowed" : "pointer",
              }}
              onClick={handleSubmit}
              disabled={stars === 0 || loading}
            >
              {loading ? "Enviando..." : "Enviar valoración ⭐"}
            </button>
          </>
        )}

        <button
          style={{
            background: "none",
            border: "none",
            color: "#8888bb",
            fontSize: 13,
            cursor: "pointer",
            marginTop: 12,
          }}
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}