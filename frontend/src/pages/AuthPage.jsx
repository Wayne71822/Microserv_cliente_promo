import { useState } from "react";
import S from "../styles/index.js";
import Toast from "../components/Toast.jsx";

export default function AuthPage({
  authTab,
  setAuthTab,
  onLogin,
  onRegister,
  toast,
  showToast,
}) {
  // 1. Definimos el estado del formulario aquí arriba
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "cliente",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = () => {
    if (authTab === "login") {
      if (!form.email.trim() || !form.password.trim())
        return showToast("Completa email y contraseña", "err");
      onLogin(form.email.trim(), form.password);
    } else {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim())
        return showToast("Todos los campos son obligatorios", "err");
      if (!validarEmail(form.email))
        return showToast("Formato de email inválido", "err");
      onRegister(form);
    }
  };

  // 2. El RETURN debe estar directamente en AuthPage
  return (
    <div style={S.authPage}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={S.authContainer}>
        {/* LADO IZQUIERDO: BRANDING */}
        <div style={S.authLeft}>
          <div>
            <div style={S.authLogo}>RH</div>
            <h1 style={S.authBrandTitle}>RestoHub</h1>
            <p style={S.authBrandSub}>Sistema de gestión multinacional</p>
          </div>
        </div>

        {/* LADO DERECHO: FORMULARIO */}
        <div style={S.authRight}>
          <div style={S.tabRow}>
            {["login", "register"].map((t) => (
              <button
                key={t}
                style={{
                  ...S.tabBtn,
                  ...(authTab === t ? S.tabBtnActive : {}),
                }}
                onClick={() => setAuthTab(t)}
              >
                {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {authTab === "register" && (
            <>
              <label style={S.label}>Nombre completo</label>
              <input
                style={S.input}
                placeholder="Carlos Mendoza"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </>
          )}

          <label style={S.label}>Correo electrónico</label>
          <input
            style={S.input}
            type="email"
            placeholder="correo@email.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />

          <label style={S.label}>Contraseña</label>
          <input
            style={S.input}
            type="password"
            placeholder="******"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />

          {authTab === "register" && (
            <>
              <label style={S.label}>Tipo de cuenta</label>
              <div style={S.roleRow}>
                {["cliente", "admin"].map((r) => (
                  <button
                    key={r}
                    style={{
                      ...S.roleBtn,
                      ...(form.role === r ? S.roleBtnActive : {}),
                    }}
                    onClick={() => set("role", r)}
                  >
                    {r === "cliente" ? "👤 Cliente" : "🔧 Admin"}
                  </button>
                ))}
              </div>
            </>
          )}

          <button style={S.primaryBtn} onClick={submit}>
            {authTab === "login" ? "Iniciar sesión →" : "Crear cuenta →"}
          </button>
        </div>
      </div>
    </div>
  );
}
