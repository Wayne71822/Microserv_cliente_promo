import S from "../styles/index.js";

export default function Toast({ msg, type }) {
  return (
    <div
      style={{
        ...S.toast,
        background:
          type === "err"
            ? "linear-gradient(135deg,#ff4444,#cc0000)"
            : "linear-gradient(135deg,#FF6B35,#FF3CAC)",
      }}
    >
      {msg}
    </div>
  );
}
