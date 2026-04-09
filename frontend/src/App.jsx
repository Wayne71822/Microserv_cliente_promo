/**
 * RestoHub - Frontend v5
 * - Usuarios nuevos sin datos precargados
 * - Carrito de compras funcional
 * - Admin: gestión completa de recompensas
 * - Límite de canje por recompensa por usuario
 * - Sin límite de puntos acumulados
 * - Sin botones de acceso rápido
 */

import { useState } from "react";

// ─── BASE DE DATOS EN MEMORIA ─────────────────────────────────────────────────
// En producción cada función de DB es una llamada GraphQL al Gateway.
const DB = {
  usuarios: [],

  platos: [
    { id: "D1", nombre: "Pasta Carbonara", emoji: "🍝", precio: 18.5, categoria: "Pasta", activo: true, reseñas: [] },
    { id: "D2", nombre: "Pizza Margherita", emoji: "🍕", precio: 15.0, categoria: "Pizza", activo: true, reseñas: [] },
    { id: "D3", nombre: "Chuletón Ibérico", emoji: "🥩", precio: 32.0, categoria: "Carnes", activo: true, reseñas: [] },
    { id: "D4", nombre: "Tiramisú", emoji: "🍮", precio: 8.0, categoria: "Postres", activo: true, reseñas: [] },
    { id: "D5", nombre: "Limonada Natural", emoji: "🍋", precio: 4.5, categoria: "Bebidas", activo: true, reseñas: [] },
    { id: "D6", nombre: "Ensalada César", emoji: "🥗", precio: 12.0, categoria: "Entradas", activo: true, reseñas: [] },
  ],

  promos: [
    { id: "P1", nombre: "Lunes de Pasta", desc: "20% en platos de pasta", tipo: "por_tiempo", scope: "global", descuentoPct: 20, validHasta: "2026-12-31", stock: null, stockUsado: 0, activa: true },
    { id: "P2", nombre: "Promo Bienvenida", desc: "10% en tu primer pedido del mes", tipo: "por_tiempo", scope: "global", descuentoPct: 10, validHasta: "2026-12-31", stock: null, stockUsado: 0, activa: true },
    { id: "P3", nombre: "Stock Limitado", desc: "Postre a mitad de precio", tipo: "por_stock", scope: "local", descuentoPct: 50, validHasta: null, stock: 15, stockUsado: 3, activa: true },
  ],

  // Recompensas con límite de canje por usuario
  // limiteXUsuario: null = sin límite, número = máximo de canjes por usuario
  recompensas: [
    { id: "R1", nombre: "Postre gratis", emoji: "🍮", puntosReq: 100, tipo: "producto", desc: "Cualquier postre del menú", limiteXUsuario: 2, activa: true },
    { id: "R2", nombre: "Bebida gratis", emoji: "🥤", puntosReq: 80, tipo: "producto", desc: "Cualquier bebida del menú", limiteXUsuario: 3, activa: true },
    { id: "R3", nombre: "Cupón 10% descuento", emoji: "🎟️", puntosReq: 200, tipo: "cupon", desc: "10% en tu próximo pedido", limiteXUsuario: null, activa: true },
    { id: "R4", nombre: "Cupón 20% descuento", emoji: "🎫", puntosReq: 400, tipo: "cupon", desc: "20% en tu próximo pedido", limiteXUsuario: null, activa: true },
    { id: "R5", nombre: "Plato principal", emoji: "🍽️", puntosReq: 600, tipo: "producto", desc: "Plato principal a elección", limiteXUsuario: 1, activa: true },
    { id: "R6", nombre: "Cupón 50% descuento", emoji: "💎", puntosReq: 1000, tipo: "cupon", desc: "50% en tu próximo pedido", limiteXUsuario: null, activa: true },
  ],

  pedidosSede: [],

  getRating(platoId) {
    const p = this.platos.find(p => p.id === platoId);
    if (!p || p.reseñas.length === 0) return null;
    return (p.reseñas.reduce((a, r) => a + r.stars, 0) / p.reseñas.length).toFixed(1);
  },

  agregarReseña(platoId, userId, userName, stars, comentario) {
    const p = this.platos.find(p => p.id === platoId);
    if (!p || p.reseñas.find(r => r.userId === userId)) return false;
    p.reseñas.push({ userId, userName, stars, comentario, fecha: new Date().toLocaleDateString() });
    return true;
  },

  yaReseñó(platoId, userId) {
    return this.platos.find(p => p.id === platoId)?.reseñas.some(r => r.userId === userId) || false;
  },

  // Cuántas veces canjeó esta recompensa este usuario
  canjesDeRecompensa(userId, recompensaId) {
    const u = this.usuarios.find(u => u.id === userId);
    if (!u) return 0;
    return (u.cuponesCanjeados || []).filter(c => c.recompensaId === recompensaId).length;
  },

  puedesCanjear(userId, recompensa) {
    const u = this.usuarios.find(u => u.id === userId);
    if (!u || !recompensa.activa) return false;
    if (u.points < recompensa.puntosReq) return false;
    if (recompensa.limiteXUsuario !== null) {
      const ya = this.canjesDeRecompensa(userId, recompensa.id);
      if (ya >= recompensa.limiteXUsuario) return false;
    }
    return true;
  },
};

const COUNTRIES = ["Venezuela", "Colombia", "Argentina", "México", "Perú", "Chile", "España"];
const RESTAURANTS = {
  Venezuela: ["RestoHub Caracas Centro", "RestoHub Maracaibo", "RestoHub Valencia"],
  Colombia: ["RestoHub Bogotá", "RestoHub Medellín"],
  Argentina: ["RestoHub Buenos Aires", "RestoHub Córdoba"],
  México: ["RestoHub CDMX", "RestoHub Guadalajara"],
  Perú: ["RestoHub Lima"],
  Chile: ["RestoHub Santiago"],
  España: ["RestoHub Madrid", "RestoHub Barcelona"],
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [authTab, setAuthTab] = useState("login");
  const [user, setUser] = useState(null);
  const [country, setCountry] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [toast, setToast] = useState(null);
  const [ratingModal, setRatingModal] = useState(null);
  const [carrito, setCarrito] = useState([]); // [{plato, cantidad, nota}]

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const updateUser = (cambios) => {
    const idx = DB.usuarios.findIndex(u => u.id === user.id);
    if (idx !== -1) Object.assign(DB.usuarios[idx], cambios);
    setUser(prev => ({ ...prev, ...cambios }));
  };

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleRegister = (d) => {
    if (DB.usuarios.find(u => u.email === d.email)) return showToast("Email ya registrado", "err");
    // Usuario nuevo — sin datos precargados
    const u = {
      ...d,
      id: "u_" + Date.now(),
      points: 0,
      historialPuntos: [],
      cuponesCanjeados: [],
      pedidos: [],
    };
    DB.usuarios.push(u);
    setUser(u);
    setScreen("onboarding");
    showToast("¡Cuenta creada!");
  };

  const handleLogin = (email, password) => {
    const u = DB.usuarios.find(u => u.email === email && u.password === password);
    if (!u) return showToast("Credenciales incorrectas", "err");
    setUser(u);
    if (u.country) { setCountry(u.country); setRestaurant(u.restaurant || ""); setScreen("home"); }
    else setScreen("onboarding");
    showToast(`¡Bienvenido, ${u.name.split(" ")[0]}!`);
  };

  const handleOnboarding = () => {
    if (!country || !restaurant) return showToast("Selecciona país y restaurante", "err");
    updateUser({ country, restaurant });
    setScreen("home");
    setActiveTab(user?.role === "admin" ? "dashboard" : "home");
    showToast(`¡Bienvenido a ${restaurant}!`);
  };

  const handleLogout = () => {
    setUser(null); setCountry(""); setRestaurant("");
    setActiveTab("home"); setScreen("auth"); setAuthTab("login");
    setCarrito([]);
    showToast("Sesión cerrada");
  };

  // ── Carrito ─────────────────────────────────────────────────────────────────
  const agregarAlCarrito = (plato, nota = "") => {
    setCarrito(prev => {
      const idx = prev.findIndex(i => i.plato.id === plato.id);
      if (idx !== -1) {
        const nuevo = [...prev];
        nuevo[idx] = { ...nuevo[idx], cantidad: nuevo[idx].cantidad + 1 };
        return nuevo;
      }
      return [...prev, { plato, cantidad: 1, nota }];
    });
    showToast(`${plato.emoji} ${plato.nombre} agregado al carrito`);
  };

  const quitarDelCarrito = (platoId) => {
    setCarrito(prev => {
      const idx = prev.findIndex(i => i.plato.id === platoId);
      if (idx === -1) return prev;
      const nuevo = [...prev];
      if (nuevo[idx].cantidad > 1) {
        nuevo[idx] = { ...nuevo[idx], cantidad: nuevo[idx].cantidad - 1 };
      } else {
        nuevo.splice(idx, 1);
      }
      return nuevo;
    });
  };

  const confirmarPedido = (promoAplicada) => {
    const total = carrito.reduce((a, i) => a + i.plato.precio * i.cantidad, 0);
    const descuento = promoAplicada ? total * (promoAplicada.descuentoPct / 100) : 0;
    const totalFinal = total - descuento;
    const pts = Math.floor(totalFinal); // 1 punto por cada unidad monetaria
    const orderId = "ORD-" + Date.now();

    const pedido = {
      id: orderId,
      fecha: new Date().toLocaleDateString(),
      items: carrito.map(i => `${i.plato.emoji} ${i.plato.nombre}${i.cantidad > 1 ? ` x${i.cantidad}` : ""}`).join(", "),
      total: totalFinal,
      pts,
      promo: promoAplicada?.nombre || null,
    };

    const tx = { id: Date.now(), delta: +pts, desc: `Puntos por pedido ${orderId}`, fecha: new Date().toLocaleDateString() };

    // Agregar a pedidos de la sede (para el admin)
    DB.pedidosSede.push({
      id: orderId,
      clienteNombre: user.name,
      fecha: new Date().toLocaleDateString(),
      total: totalFinal,
      items: pedido.items,
      estado: "completado",
    });

    updateUser({
      points: user.points + pts,           // sin límite de acumulación
      historialPuntos: [...(user.historialPuntos || []), tx],
      pedidos: [...(user.pedidos || []), pedido],
    });

    setCarrito([]);
    setActiveTab("history");
    showToast(`¡Pedido confirmado! +${pts} pts 🎉`);
  };

  // ── Reseña ──────────────────────────────────────────────────────────────────
  const handleReseña = (platoId, stars, comentario) => {
    if (DB.yaReseñó(platoId, user.id)) return showToast("Ya valoraste este plato", "err");
    DB.agregarReseña(platoId, user.id, user.name, stars, comentario);
    const pts = stars * 5;
    const tx = { id: Date.now(), delta: +pts, desc: "Bonus por reseña", fecha: new Date().toLocaleDateString() };
    updateUser({
      points: user.points + pts,
      historialPuntos: [...(user.historialPuntos || []), tx],
    });
    showToast(`¡Gracias! +${pts} pts bonus`);
    setRatingModal(null);
  };

  // ── Canje ───────────────────────────────────────────────────────────────────
  const handleCanje = (recompensa) => {
    if (!DB.puedesCanjear(user.id, recompensa)) return showToast("No puedes canjear esta recompensa", "err");
    const codigo = recompensa.tipo === "cupon" ? "CUPON-" + Math.random().toString(36).substring(2, 8).toUpperCase() : null;
    const tx = { id: Date.now(), delta: -recompensa.puntosReq, desc: `Canje: ${recompensa.nombre}`, fecha: new Date().toLocaleDateString() };
    const canje = { recompensaId: recompensa.id, nombre: recompensa.nombre, emoji: recompensa.emoji, codigo, fecha: new Date().toLocaleDateString() };
    updateUser({
      points: user.points - recompensa.puntosReq,
      historialPuntos: [...(user.historialPuntos || []), tx],
      cuponesCanjeados: [...(user.cuponesCanjeados || []), canje],
    });
    showToast(codigo ? `¡Cupón generado! Código: ${codigo}` : `¡${recompensa.nombre} desbloqueado!`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (screen === "auth") return <AuthScreen authTab={authTab} setAuthTab={setAuthTab}
    onLogin={handleLogin} onRegister={handleRegister} toast={toast} showToast={showToast} />;

  if (screen === "onboarding") return <OnboardingScreen user={user}
    country={country} setCountry={setCountry}
    restaurant={restaurant} setRestaurant={setRestaurant}
    onStart={handleOnboarding} toast={toast} />;

  const isAdmin = user?.role === "admin";
  const cantCarrito = carrito.reduce((a, i) => a + i.cantidad, 0);

  const clienteTabs = [
    { id: "home", icon: "🏠", label: "Inicio" },
    { id: "menu", icon: "🍽️", label: "Menú" },
    { id: "carrito", icon: `🛒${cantCarrito > 0 ? ` (${cantCarrito})` : ""}`, label: "Carrito" },
    { id: "promos", icon: "🎁", label: "Promos" },
    { id: "history", icon: "📋", label: "Pedidos" },
    { id: "points", icon: "⭐", label: "Puntos" },
    { id: "profile", icon: "👤", label: "Perfil" },
  ];

  const adminTabs = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "platos", icon: "🍽️", label: "Platos" },
    { id: "promos", icon: "🎁", label: "Promos" },
    { id: "recompensas", icon: "⭐", label: "Puntos" },
    { id: "clientes", icon: "👥", label: "Clientes" },
    { id: "pedidos", icon: "📋", label: "Pedidos" },
    { id: "profile", icon: "👤", label: "Perfil" },
  ];

  const tabs = isAdmin ? adminTabs : clienteTabs;

  return (
    <div style={S.app}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}>RH</div>
          <div>
            <div style={S.headerTitle}>RestoHub</div>
            <div style={S.headerSub}>{user?.restaurant || restaurant}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isAdmin && (
            <div style={S.pointsBadge}>
              <span>⭐</span>
              {/* Puntos sin límite — solo muestran el total real */}
              <span style={S.pointsNum}>{(user?.points || 0).toLocaleString()} pts</span>
            </div>
          )}
          {!isAdmin && cantCarrito > 0 && (
            <button style={S.cartBadge} onClick={() => setActiveTab("carrito")}>
              🛒 {cantCarrito}
            </button>
          )}
          {isAdmin && (
            <div style={{ ...S.pointsBadge, background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.3)" }}>
              <span>🔧</span><span style={{ ...S.pointsNum, color: "#7C5CFC" }}>Admin</span>
            </div>
          )}
        </div>
      </header>

      <main style={S.main}>
        <div style={S.mainInner}>
          {/* CLIENTE */}
          {!isAdmin && activeTab === "home" && <HomeTab user={user} showToast={showToast} setRatingModal={setRatingModal} setActiveTab={setActiveTab} />}
          {!isAdmin && activeTab === "menu" && <MenuTab user={user} onAgregar={agregarAlCarrito} setRatingModal={setRatingModal} />}
          {!isAdmin && activeTab === "carrito" && <CarritoTab carrito={carrito} onAgregar={agregarAlCarrito} onQuitar={quitarDelCarrito} onConfirmar={confirmarPedido} promos={DB.promos} />}
          {!isAdmin && activeTab === "promos" && <PromosTab />}
          {!isAdmin && activeTab === "history" && <HistoryTab user={user} />}
          {!isAdmin && activeTab === "points" && <PointsTab user={user} onCanje={handleCanje} />}
          {/* ADMIN */}
          {isAdmin && activeTab === "dashboard" && <AdminDashboard />}
          {isAdmin && activeTab === "platos" && <AdminPlatos showToast={showToast} />}
          {isAdmin && activeTab === "promos" && <AdminPromos showToast={showToast} />}
          {isAdmin && activeTab === "recompensas" && <AdminRecompensas showToast={showToast} />}
          {isAdmin && activeTab === "clientes" && <AdminClientes />}
          {isAdmin && activeTab === "pedidos" && <AdminPedidos />}
          {/* COMPARTIDO */}
          {activeTab === "profile" && <ProfileTab user={user} onLogout={handleLogout} updateUser={updateUser} showToast={showToast} isAdmin={isAdmin} />}
        </div>
      </main>

      {ratingModal && (
        <RatingModal plato={ratingModal} userId={user.id}
          yaReseñó={DB.yaReseñó(ratingModal.id, user.id)}
          onSubmit={handleReseña} onClose={() => setRatingModal(null)} />
      )}

      <nav style={S.nav}>
        <div style={S.navInner}>
          {tabs.map(tab => (
            <button key={tab.id}
              style={{ ...S.navBtn, ...(activeTab === tab.id ? S.navBtnActive : {}) }}
              onClick={() => setActiveTab(tab.id)}>
              <span style={S.navIcon}>{tab.icon}</span>
              <span style={S.navLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ authTab, setAuthTab, onLogin, onRegister, toast, showToast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "cliente" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (authTab === "login") {
      if (!form.email || !form.password) return showToast("Completa todos los campos", "err");
      onLogin(form.email, form.password);
    } else {
      if (!form.name || !form.email || !form.password) return showToast("Completa todos los campos", "err");
      if (!form.email.includes("@")) return showToast("Email inválido", "err");
      if (form.password.length < 6) return showToast("Mínimo 6 caracteres", "err");
      onRegister(form);
    }
  };

  return (
    <div style={S.authPage}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={S.authContainer}>
        <div style={S.authLeft}>
          <div>
            <div style={S.authLogo}>RH</div>
            <h1 style={S.authBrandTitle}>RestoHub</h1>
            <p style={S.authBrandSub}>Sistema de gestión para cadenas de restaurantes multinacionales</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["🌍", "7 países"], ["🍽️", "200+ restaurantes"], ["⭐", "Fidelización"], ["🎁", "Promos en tiempo real"]].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 14, color: "#aaaacc" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.authRight}>
          <div style={S.authLogoMobile}>RH</div>
          <div style={S.tabRow}>
            {["login", "register"].map(t => (
              <button key={t} style={{ ...S.tabBtn, ...(authTab === t ? S.tabBtnActive : {}) }} onClick={() => setAuthTab(t)}>
                {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {authTab === "register" && <>
            <label style={S.label}>Nombre completo</label>
            <input style={S.input} placeholder="Carlos Mendoza" value={form.name} onChange={e => set("name", e.target.value)} />
            <label style={S.label}>Teléfono</label>
            <input style={S.input} placeholder="+58 412 000 0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
          </>}

          <label style={S.label}>Correo electrónico</label>
          <input style={S.input} type="email" placeholder="correo@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
          <label style={S.label}>Contraseña</label>
          <input style={S.input} type="password" placeholder={authTab === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
            value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />

          {authTab === "register" && <>
            <label style={S.label}>Tipo de cuenta</label>
            <div style={S.roleRow}>
              {["cliente", "admin"].map(r => (
                <button key={r} style={{ ...S.roleBtn, ...(form.role === r ? S.roleBtnActive : {}) }} onClick={() => set("role", r)}>
                  {r === "cliente" ? "👤 Cliente" : "🔧 Admin"}
                </button>
              ))}
            </div>
          </>}

          <button style={S.primaryBtn} onClick={submit}>
            {authTab === "login" ? "Iniciar sesión →" : "Crear cuenta →"}
          </button>
          {authTab === "login" && (
            <p style={{ fontSize: 13, color: "#8888bb", textAlign: "center", marginTop: 14 }}>
              ¿No tienes cuenta?{" "}
              <span style={{ color: "#FF6B35", cursor: "pointer", textDecoration: "underline" }} onClick={() => setAuthTab("register")}>Regístrate</span>
            </p>
          )}
          <p style={{ fontSize: 11, color: "#4444aa", textAlign: "center", marginTop: 12 }}>🔒 Auth0 en producción</p>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingScreen({ user, country, setCountry, restaurant, setRestaurant, onStart, toast }) {
  return (
    <div style={S.authPage}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={S.onboardingCard}>
        <div style={S.authLogo}>RH</div>
        <h1 style={{ ...S.authBrandTitle, marginTop: 16 }}>¡Hola, {user?.name?.split(" ")[0]}!</h1>
        <p style={S.authBrandSub}>¿Dónde estás hoy?</p>
        <label style={S.label}>País</label>
        <select style={S.select} value={country} onChange={e => { setCountry(e.target.value); setRestaurant(""); }}>
          <option value="">Selecciona tu país...</option>
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {country && <>
          <label style={S.label}>Restaurante</label>
          <select style={S.select} value={restaurant} onChange={e => setRestaurant(e.target.value)}>
            <option value="">Selecciona restaurante...</option>
            {RESTAURANTS[country]?.map(r => <option key={r}>{r}</option>)}
          </select>
        </>}
        <button style={{ ...S.primaryBtn, opacity: (!country || !restaurant) ? 0.4 : 1 }} onClick={onStart}>Entrar →</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABS CLIENTE
// ══════════════════════════════════════════════════════════════════════════════

// ─── HOME (sin acceso rápido) ─────────────────────────────────────────────────
function HomeTab({ user, showToast, setRatingModal, setActiveTab }) {
  const pedidos = user?.pedidos || [];
  const tieneReseñasPendientes = DB.platos.some(p => !DB.yaReseñó(p.id, user?.id) && pedidos.length > 0);

  return (
    <div>
      <div style={S.welcomeCard}>
        <div style={{ fontSize: 36 }}>👋</div>
        <div style={{ flex: 1 }}>
          <div style={S.welcomeName}>Hola, {user?.name?.split(" ")[0]}</div>
          <div style={{ fontSize: 13, color: "#8888bb", marginTop: 4 }}>{user?.restaurant} · {user?.country}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FF6B35" }}>{user?.points || 0}</div>
          <div style={{ fontSize: 11, color: "#8888bb" }}>puntos</div>
        </div>
      </div>

      {/* Resumen del usuario */}
      <SectionTitle>Mi resumen</SectionTitle>
      <div style={S.grid2}>
        {[
          { icon: "📋", label: "Pedidos realizados", value: pedidos.length, color: "#FF6B35" },
          { icon: "⭐", label: "Puntos acumulados", value: (user?.points || 0).toLocaleString(), color: "#FFD700" },
          { icon: "🎟️", label: "Cupones canjeados", value: (user?.cuponesCanjeados || []).length, color: "#7C5CFC" },
          { icon: "📝", label: "Reseñas enviadas", value: DB.platos.filter(p => DB.yaReseñó(p.id, user?.id)).length, color: "#00C896" },
        ].map((s, i) => (
          <div key={i} style={{ ...S.statCard }}>
            <div style={{ fontSize: 26 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {pedidos.length === 0 && (
        <div style={{ ...S.emptyState, marginTop: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontWeight: 600, color: "#e8e8f0", marginBottom: 6 }}>¡Haz tu primer pedido!</div>
          <div style={{ fontSize: 13, color: "#8888bb", marginBottom: 16 }}>Ve al menú y agrega platos a tu carrito</div>
          <button style={{ ...S.primaryBtn, width: "auto", padding: "12px 24px", marginTop: 0 }}
            onClick={() => setActiveTab("menu")}>
            Ver menú →
          </button>
        </div>
      )}

      {tieneReseñasPendientes && (
        <>
          <SectionTitle>Platos sin valorar</SectionTitle>
          <div style={S.grid2}>
            {DB.platos.filter(p => p.activo && !DB.yaReseñó(p.id, user?.id)).slice(0, 4).map(plato => (
              <div key={plato.id} style={S.dishCard}>
                <span style={{ fontSize: 26 }}>{plato.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.dishName}>{plato.nombre}</div>
                  <div style={{ fontSize: 12, color: "#8888bb" }}>Sin tu valoración</div>
                </div>
                <button style={S.rateBtn} onClick={() => setRatingModal(plato)}>Valorar</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MENÚ + AGREGAR AL CARRITO ────────────────────────────────────────────────
function MenuTab({ user, onAgregar, setRatingModal }) {
  const [categoria, setCategoria] = useState("Todos");
  const categorias = ["Todos", ...new Set(DB.platos.map(p => p.categoria))];
  const filtrados = DB.platos.filter(p => p.activo && (categoria === "Todos" || p.categoria === categoria));

  return (
    <div>
      <SectionTitle>Menú del restaurante</SectionTitle>
      {/* Filtro por categoría */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {categorias.map(c => (
          <button key={c}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "1px solid", fontSize: 13, cursor: "pointer", fontWeight: 600,
              background: categoria === c ? "rgba(255,107,53,0.2)" : "transparent",
              color: categoria === c ? "#FF6B35" : "#8888bb",
              borderColor: categoria === c ? "rgba(255,107,53,0.5)" : "#2a2a4a"
            }}
            onClick={() => setCategoria(c)}>{c}
          </button>
        ))}
      </div>

      <div style={S.grid2}>
        {filtrados.map(plato => {
          const rating = DB.getRating(plato.id);
          const ya = DB.yaReseñó(plato.id, user?.id);
          return (
            <div key={plato.id} style={{ ...S.dishCard, flexDirection: "column", alignItems: "stretch", gap: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 34 }}>{plato.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.dishName}>{plato.nombre}</div>
                  <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>{plato.categoria}</div>
                  <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>
                    {rating ? `⭐ ${rating} (${DB.platos.find(p => p.id === plato.id)?.reseñas.length})` : "Sin valorar"}
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#FF6B35" }}>${plato.precio.toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.primaryBtn, flex: 2, marginTop: 0, padding: "10px 0", fontSize: 14 }}
                  onClick={() => onAgregar(plato)}>
                  + Agregar
                </button>
                <button style={{ ...S.rateBtn, opacity: ya ? 0.4 : 1, cursor: ya ? "not-allowed" : "pointer", flex: 1, textAlign: "center" }}
                  onClick={() => !ya && setRatingModal(plato)}>
                  {ya ? "✅" : "⭐ Valorar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CARRITO ──────────────────────────────────────────────────────────────────
function CarritoTab({ carrito, onAgregar, onQuitar, onConfirmar, promos }) {
  const [promoSel, setPromoSel] = useState(null);
  const [nota, setNota] = useState("");

  const subtotal = carrito.reduce((a, i) => a + i.plato.precio * i.cantidad, 0);
  const descuento = promoSel ? subtotal * (promoSel.descuentoPct / 100) : 0;
  const total = subtotal - descuento;

  const promosActivas = promos.filter(p => {
    if (!p.activa) return false;
    if (p.tipo === "por_tiempo" && p.validHasta && new Date(p.validHasta) < new Date()) return false;
    if (p.tipo === "por_stock" && p.stock !== null && p.stockUsado >= p.stock) return false;
    return true;
  });

  if (carrito.length === 0) {
    return (
      <div>
        <SectionTitle>Mi carrito</SectionTitle>
        <div style={S.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          <div style={{ fontWeight: 600, color: "#e8e8f0", marginBottom: 6 }}>Tu carrito está vacío</div>
          <div style={{ fontSize: 13, color: "#8888bb" }}>Ve al menú y agrega platos</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Mi carrito ({carrito.reduce((a, i) => a + i.cantidad, 0)} items)</SectionTitle>

      {/* Items del carrito */}
      {carrito.map(item => (
        <div key={item.plato.id} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 14, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{item.plato.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>{item.plato.nombre}</div>
              <div style={{ fontSize: 13, color: "#FF6B35" }}>${item.plato.precio.toFixed(2)} c/u</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={S.qtyBtn} onClick={() => onQuitar(item.plato.id)}>−</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#fff", minWidth: 24, textAlign: "center" }}>{item.cantidad}</span>
              <button style={S.qtyBtn} onClick={() => onAgregar(item.plato)}>+</button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8f0", minWidth: 60, textAlign: "right" }}>
              ${(item.plato.precio * item.cantidad).toFixed(2)}
            </div>
          </div>
        </div>
      ))}

      {/* Nota del pedido */}
      <label style={S.label}>Nota para cocina (opcional)</label>
      <textarea style={{ ...S.input, height: 70, resize: "none", fontFamily: "inherit", marginBottom: 16 }}
        placeholder="Sin cebolla, alergia a nueces, etc."
        value={nota} onChange={e => setNota(e.target.value)} />

      {/* Seleccionar promo */}
      {promosActivas.length > 0 && (
        <>
          <label style={S.label}>Aplicar promoción</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <button style={{ ...S.roleBtn, ...(promoSel === null ? S.roleBtnActive : {}) }} onClick={() => setPromoSel(null)}>
              Sin promo
            </button>
            {promosActivas.map(p => (
              <button key={p.id}
                style={{ ...S.roleBtn, ...(promoSel?.id === p.id ? S.roleBtnActive : {}) }}
                onClick={() => setPromoSel(p)}>
                🎁 {p.nombre} — {p.descuentoPct}% descuento
              </button>
            ))}
          </div>
        </>
      )}

      {/* Resumen de precios */}
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#8888bb" }}>Subtotal</span>
          <span style={{ color: "#e8e8f0" }}>${subtotal.toFixed(2)}</span>
        </div>
        {descuento > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#00C896" }}>Descuento ({promoSel?.nombre})</span>
            <span style={{ color: "#00C896" }}>-${descuento.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #2a2a4a", paddingTop: 10, marginTop: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#FF6B35" }}>${total.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 12, color: "#8888bb", marginTop: 8 }}>
          Ganarás ≈ <b style={{ color: "#FF6B35" }}>{Math.floor(total)} pts</b> con este pedido
        </div>
      </div>

      <button style={S.primaryBtn} onClick={() => onConfirmar(promoSel)}>
        Confirmar pedido → ${total.toFixed(2)}
      </button>
    </div>
  );
}

// ─── PROMOS ───────────────────────────────────────────────────────────────────
function PromosTab() {
  const activas = DB.promos.filter(p => {
    if (!p.activa) return false;
    if (p.tipo === "por_tiempo" && p.validHasta && new Date(p.validHasta) < new Date()) return false;
    if (p.tipo === "por_stock" && p.stock !== null && p.stockUsado >= p.stock) return false;
    return true;
  });
  const colores = { por_tiempo: "#FF6B35", por_stock: "#7C5CFC" };
  return (
    <div>
      <SectionTitle>Promociones activas ({activas.length})</SectionTitle>
      {activas.length === 0 && <div style={S.emptyState}>😔 No hay promos activas ahora</div>}
      <div style={S.grid2}>
        {activas.map(p => {
          const color = colores[p.tipo] || "#FF6B35";
          const restante = p.stock ? p.stock - p.stockUsado : null;
          return (
            <div key={p.id} style={{ ...S.promoCard, borderLeft: `4px solid ${color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={S.promoName}>{p.nombre}</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <span style={{ ...S.badge, background: color }}>{p.tipo === "por_stock" ? "STOCK" : "TIEMPO"}</span>
                  <span style={{ ...S.badge, background: p.scope === "global" ? "#00C896" : "#FF6B35" }}>{p.scope.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 6 }}>{p.desc}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{p.descuentoPct}% descuento</div>
              {restante !== null && <div style={{ fontSize: 11, color: "#8888bb", marginTop: 4 }}>Quedan {restante} unidades</div>}
              {p.validHasta && <div style={{ fontSize: 11, color: "#8888bb", marginTop: 4 }}>Hasta: {p.validHasta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── HISTORIAL (con datos reales del usuario) ─────────────────────────────────
function HistoryTab({ user }) {
  const pedidos = user?.pedidos || [];
  return (
    <div>
      <SectionTitle>Mis pedidos ({pedidos.length})</SectionTitle>
      {pedidos.length === 0 && <div style={S.emptyState}>No has realizado pedidos aún</div>}
      <div style={S.grid2}>
        {[...pedidos].reverse().map(p => (
          <div key={p.id} style={S.orderCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#FF6B35" }}>{p.id}</span>
              <span style={{ fontSize: 12, color: "#8888bb" }}>{p.fecha}</span>
            </div>
            {p.promo && <div style={{ fontSize: 11, color: "#00C896", marginBottom: 4 }}>🎁 {p.promo}</div>}
            <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 10 }}>{p.items}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0" }}>${p.total.toFixed(2)}</span>
              <span style={{ fontSize: 12, color: "#00C896" }}>+{p.pts} pts ✅</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PUNTOS (sin límite de acumulación, con límite de canje por recompensa) ───
function PointsTab({ user, onCanje }) {
  const points = user?.points || 0;
  const historial = user?.historialPuntos || [];
  const cupones = user?.cuponesCanjeados || [];
  const [vista, setVista] = useState("recompensas");

  return (
    <div>
      <div style={S.pointsCard}>
        <div style={{ fontSize: 12, color: "#8888bb", textTransform: "uppercase", letterSpacing: 1 }}>Mis puntos</div>
        {/* Sin barra de límite — los puntos se acumulan sin tope */}
        <div style={{ fontSize: 56, fontWeight: 900, color: "#FF6B35", margin: "8px 0 4px" }}>{points.toLocaleString()}</div>
        <div style={{ fontSize: 14, color: "#aaaacc" }}>⭐ puntos acumulados · sin límite</div>
      </div>

      <div style={{ ...S.tabRow, marginTop: 20 }}>
        {[["recompensas", "🎁 Canjear"], ["cupones", "🎟️ Mis canjes"], ["historial", "📜 Historial"]].map(([id, label]) => (
          <button key={id} style={{ ...S.tabBtn, ...(vista === id ? S.tabBtnActive : {}) }} onClick={() => setVista(id)}>{label}</button>
        ))}
      </div>

      {/* Catálogo de recompensas */}
      {vista === "recompensas" && (
        <div>
          <p style={{ fontSize: 12, color: "#6666aa", marginBottom: 16 }}>Canjea tus puntos por productos o cupones</p>
          <div style={S.grid2}>
            {DB.recompensas.filter(r => r.activa).map(r => {
              const puedo = DB.puedesCanjear(user.id, r);
              const yaCanjeó = DB.canjesDeRecompensa(user.id, r.id);
              const limite = r.limiteXUsuario;
              const agotado = limite !== null && yaCanjeó >= limite;
              const sinPuntos = points < r.puntosReq;

              let razon = "";
              if (agotado) razon = `Límite alcanzado (${limite}/${limite})`;
              else if (sinPuntos) razon = `Necesitas ${r.puntosReq - points} pts más`;

              return (
                <div key={r.id} style={{ ...S.rewardCard, opacity: puedo ? 1 : 0.6, borderColor: puedo ? "rgba(255,107,53,0.35)" : "#2a2a4a" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{r.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4 }}>{r.nombre}</div>
                  <div style={{ fontSize: 12, color: "#8888bb", marginBottom: 8 }}>{r.desc}</div>
                  {limite !== null && (
                    <div style={{ fontSize: 11, color: "#6666aa", marginBottom: 8 }}>
                      Límite: {yaCanjeó}/{limite} canjes usados
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: puedo ? "#FF6B35" : "#666688" }}>
                      {r.puntosReq} pts
                    </span>
                    <button
                      style={{
                        ...S.rateBtn, opacity: puedo ? 1 : 0.4, cursor: puedo ? "pointer" : "not-allowed",
                        background: puedo ? "rgba(255,107,53,0.15)" : "rgba(100,100,120,0.1)",
                        color: puedo ? "#FF6B35" : "#666688"
                      }}
                      onClick={() => puedo && onCanje(r)}
                      title={razon}>
                      {agotado ? "Agotado" : sinPuntos ? "Insuficiente" : "Canjear →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Canjes realizados */}
      {vista === "cupones" && (
        <div>
          {cupones.length === 0
            ? <div style={S.emptyState}>No has canjeado nada aún</div>
            : [...cupones].reverse().map((c, i) => (
              <div key={i} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{c.nombre}</div>
                    <div style={{ fontSize: 12, color: "#8888bb", marginTop: 3 }}>Canjeado: {c.fecha}</div>
                  </div>
                  {c.codigo && (
                    <div style={{ background: "rgba(255,107,53,0.15)", border: "1px dashed #FF6B35", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#8888bb", marginBottom: 2 }}>CÓDIGO</div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#FF6B35", letterSpacing: 2 }}>{c.codigo}</div>
                    </div>
                  )}
                  {!c.codigo && <span style={{ fontSize: 22 }}>✅</span>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Historial de movimientos */}
      {vista === "historial" && (
        <div>
          {historial.length === 0
            ? <div style={S.emptyState}>Sin movimientos aún</div>
            : [...historial].reverse().map(tx => (
              <div key={tx.id} style={S.txRow}>
                <div>
                  <div style={{ fontSize: 13, color: "#e8e8f0" }}>{tx.desc}</div>
                  <div style={{ fontSize: 11, color: "#6666aa", marginTop: 3 }}>{tx.fecha}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: tx.delta > 0 ? "#00C896" : "#FF6B6B" }}>
                  {tx.delta > 0 ? "+" : ""}{tx.delta} pts
                </span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────
function ProfileTab({ user, onLogout, updateUser, showToast, isAdmin }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "", email: user?.email || "", phone: user?.phone || "",
    password: "", country: user?.country || "", restaurant: user?.restaurant || "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const guardar = () => {
    if (!form.name.trim()) return showToast("Nombre vacío", "err");
    if (!form.email.includes("@")) return showToast("Email inválido", "err");
    const cambios = { name: form.name, email: form.email, phone: form.phone, country: form.country, restaurant: form.restaurant };
    if (form.password.length > 0) {
      if (form.password.length < 6) return showToast("Contraseña mínimo 6 caracteres", "err");
      cambios.password = form.password;
    }
    updateUser(cambios); setEditando(false); showToast("Perfil actualizado");
  };

  return (
    <div>
      <div style={S.profileHeader}>
        <div style={S.avatar}>{(user?.name || "U")[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: "#8888bb", marginTop: 3 }}>{user?.email}</div>
          <span style={{ ...S.badge, background: isAdmin ? "#7C5CFC" : "#00C896", display: "inline-block", marginTop: 6 }}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
        <button style={{ background: "none", border: "1px solid #2a2a4a", color: "#8888bb", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}
          onClick={() => setEditando(!editando)}>{editando ? "Cancelar" : "✏️ Editar"}</button>
      </div>

      {editando && (
        <div style={{ ...S.formCard, marginTop: 16 }}>
          <div style={S.grid2}>
            <div><label style={S.label}>Nombre</label><input style={S.input} value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div><label style={S.label}>Email</label><input style={S.input} type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><label style={S.label}>Teléfono</label><input style={S.input} placeholder="+58 412 000 0000" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div><label style={S.label}>Nueva contraseña</label><input style={S.input} type="password" placeholder="Dejar vacío para no cambiar" value={form.password} onChange={e => set("password", e.target.value)} /></div>
            <div>
              <label style={S.label}>País</label>
              <select style={S.select} value={form.country} onChange={e => { set("country", e.target.value); set("restaurant", ""); }}>
                <option value="">Selecciona...</option>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Restaurante</label>
              <select style={S.select} value={form.restaurant} onChange={e => set("restaurant", e.target.value)}>
                <option value="">Selecciona...</option>
                {(RESTAURANTS[form.country] || []).map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 16 }} onClick={guardar}>Guardar cambios</button>
        </div>
      )}

      <SectionTitle>Mi información</SectionTitle>
      {[
        { label: "País", value: user?.country || "—", icon: "🌍" },
        { label: "Restaurante", value: user?.restaurant || "—", icon: "🏪" },
        { label: "Teléfono", value: user?.phone || "No registrado", icon: "📱" },
        ...(!isAdmin ? [{ label: "Puntos", value: `${(user?.points || 0).toLocaleString()} pts`, icon: "⭐" }] : []),
      ].map(row => (
        <div key={row.label} style={S.infoRow}>
          <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>{row.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#6666aa", textTransform: "uppercase", letterSpacing: 0.8 }}>{row.label}</div>
            <div style={{ fontSize: 14, color: "#e8e8f0", marginTop: 2, fontWeight: 600 }}>{row.value}</div>
          </div>
        </div>
      ))}
      <button style={S.dangerBtn} onClick={onLogout}>Cerrar sesión</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABS ADMIN
// ══════════════════════════════════════════════════════════════════════════════

function AdminDashboard() {
  const clientes = DB.usuarios.filter(u => u.role === "cliente");
  const totalPts = clientes.reduce((a, u) => a + (u.points || 0), 0);
  const totalReseñas = DB.platos.reduce((a, p) => a + p.reseñas.length, 0);
  return (
    <div>
      <SectionTitle>Resumen de la sede</SectionTitle>
      <div style={S.grid2}>
        {[
          { label: "Clientes", value: clientes.length, icon: "👥", color: "#00C896" },
          { label: "Pedidos", value: DB.pedidosSede.length, icon: "📋", color: "#FF6B35" },
          { label: "Promos activas", value: DB.promos.filter(p => p.activa).length, icon: "🎁", color: "#7C5CFC" },
          { label: "Platos activos", value: DB.platos.filter(p => p.activo).length, icon: "🍽️", color: "#FFD700" },
          { label: "Puntos emitidos", value: totalPts.toLocaleString(), icon: "⭐", color: "#FF6B35" },
          { label: "Reseñas", value: totalReseñas, icon: "📝", color: "#00C896" },
        ].map((s, i) => (
          <div key={i} style={{ ...S.orderCard, textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#8888bb", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <SectionTitle>Platos mejor valorados</SectionTitle>
      {DB.platos.filter(p => p.reseñas.length > 0)
        .sort((a, b) => { const ra = a.reseñas.reduce((s, r) => s + r.stars, 0) / a.reseñas.length; const rb = b.reseñas.reduce((s, r) => s + r.stars, 0) / b.reseñas.length; return rb - ra; })
        .slice(0, 3).map(p => {
          const r = (p.reseñas.reduce((s, r) => s + r.stars, 0) / p.reseñas.length).toFixed(1);
          return (
            <div key={p.id} style={S.txRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{p.emoji}</span>
                <div><div style={{ fontSize: 14, color: "#e8e8f0", fontWeight: 600 }}>{p.nombre}</div><div style={{ fontSize: 12, color: "#8888bb" }}>{p.reseñas.length} reseñas</div></div>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#FFD700" }}>⭐ {r}</span>
            </div>
          );
        })}
      {DB.platos.every(p => p.reseñas.length === 0) && <div style={S.emptyState}>Sin reseñas todavía</div>}
    </div>
  );
}

function AdminPlatos({ showToast }) {
  const [agregando, setAgregando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [verReseñas, setVerReseñas] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: "", emoji: "🍽️", precio: "", categoria: "" });
  const [, force] = useState(0); const rf = () => force(n => n + 1);

  const toggleActivo = id => { const p = DB.platos.find(p => p.id === id); p.activo = !p.activo; rf(); showToast(`Plato ${p.activo ? "activado" : "desactivado"}`); };
  const guardar = (id, cambios) => { const idx = DB.platos.findIndex(p => p.id === id); Object.assign(DB.platos[idx], cambios); rf(); setEditando(null); showToast("Plato actualizado"); };
  const agregar = () => {
    if (!nuevo.nombre || !nuevo.precio) return showToast("Nombre y precio obligatorios", "err");
    DB.platos.push({ id: "D" + Date.now(), ...nuevo, precio: parseFloat(nuevo.precio), activo: true, reseñas: [] });
    setNuevo({ nombre: "", emoji: "🍽️", precio: "", categoria: "" }); setAgregando(false); rf(); showToast("Plato agregado");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionTitle>Platos ({DB.platos.length})</SectionTitle>
        <button style={{ ...S.primaryBtn, width: "auto", padding: "10px 18px", marginTop: 24, fontSize: 13 }} onClick={() => setAgregando(!agregando)}>
          {agregando ? "Cancelar" : "+ Agregar"}
        </button>
      </div>
      {agregando && (
        <div style={{ ...S.formCard, marginBottom: 16 }}>
          <div style={S.grid2}>
            <div><label style={S.label}>Emoji</label><input style={S.input} value={nuevo.emoji} onChange={e => setNuevo(p => ({ ...p, emoji: e.target.value }))} /></div>
            <div><label style={S.label}>Nombre</label><input style={S.input} value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} /></div>
            <div><label style={S.label}>Precio</label><input style={S.input} type="number" value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} /></div>
            <div><label style={S.label}>Categoría</label><input style={S.input} value={nuevo.categoria} onChange={e => setNuevo(p => ({ ...p, categoria: e.target.value }))} /></div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={agregar}>Agregar plato</button>
        </div>
      )}
      {verReseñas && (
        <div style={S.modalOverlay} onClick={() => setVerReseñas(null)}>
          <div style={{ ...S.modal, maxWidth: 500, textAlign: "left" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 36 }}>{verReseñas.emoji}</span>
              <div><div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{verReseñas.nombre}</div>
                <div style={{ fontSize: 13, color: "#8888bb" }}>{verReseñas.reseñas.length} reseñas · Promedio: {DB.getRating(verReseñas.id) || "—"} ⭐</div></div>
            </div>
            {verReseñas.reseñas.length === 0 && <div style={S.emptyState}>Sin reseñas</div>}
            {verReseñas.reseñas.map((r, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid #1e1e3a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#e8e8f0" }}>👤 {r.userName}</div>
                  <div style={{ color: "#FFD700", fontSize: 14 }}>{"⭐".repeat(r.stars)}</div>
                </div>
                {r.comentario && <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 2 }}>"{r.comentario}"</div>}
                <div style={{ fontSize: 11, color: "#6666aa" }}>{r.fecha}</div>
              </div>
            ))}
            <button style={{ background: "none", border: "1px solid #2a2a4a", color: "#8888bb", borderRadius: 10, padding: "10px 20px", cursor: "pointer", marginTop: 16, width: "100%", fontSize: 13 }} onClick={() => setVerReseñas(null)}>Cerrar</button>
          </div>
        </div>
      )}
      {DB.platos.map(plato => {
        const rating = DB.getRating(plato.id);
        return (
          <div key={plato.id} style={{ ...S.formCard, marginBottom: 10, opacity: plato.activo ? 1 : 0.55 }}>
            {editando !== plato.id ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 26 }}>{plato.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={S.dishName}>{plato.nombre}</div>
                  <div style={{ fontSize: 12, color: "#8888bb" }}>${plato.precio.toFixed(2)} · {plato.categoria}{rating ? ` · ⭐ ${rating}` : ""} · {plato.reseñas.length} reseñas</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={S.adminBtn} onClick={() => setVerReseñas(plato)}>💬</button>
                  <button style={S.adminBtn} onClick={() => setEditando(plato.id)}>✏️</button>
                  <button style={{ ...S.adminBtn, background: plato.activo ? "rgba(255,107,107,0.15)" : "rgba(0,200,150,0.15)", color: plato.activo ? "#FF6B6B" : "#00C896" }} onClick={() => toggleActivo(plato.id)}>{plato.activo ? "🔴" : "🟢"}</button>
                </div>
              </div>
            ) : (
              <EditPlatoForm plato={plato} onSave={c => guardar(plato.id, c)} onCancel={() => setEditando(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditPlatoForm({ plato, onSave, onCancel }) {
  const [f, setF] = useState({ nombre: plato.nombre, emoji: plato.emoji, precio: plato.precio, categoria: plato.categoria });
  return (
    <div>
      <div style={S.grid2}>
        <div><label style={S.label}>Emoji</label><input style={S.input} value={f.emoji} onChange={e => setF(p => ({ ...p, emoji: e.target.value }))} /></div>
        <div><label style={S.label}>Nombre</label><input style={S.input} value={f.nombre} onChange={e => setF(p => ({ ...p, nombre: e.target.value }))} /></div>
        <div><label style={S.label}>Precio</label><input style={S.input} type="number" value={f.precio} onChange={e => setF(p => ({ ...p, precio: e.target.value }))} /></div>
        <div><label style={S.label}>Categoría</label><input style={S.input} value={f.categoria} onChange={e => setF(p => ({ ...p, categoria: e.target.value }))} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button style={{ ...S.primaryBtn, marginTop: 0, flex: 1 }} onClick={() => onSave({ ...f, precio: parseFloat(f.precio) })}>Guardar</button>
        <button style={{ ...S.dangerBtn, marginTop: 0, flex: 0.4 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function AdminPromos({ showToast }) {
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({ nombre: "", desc: "", tipo: "por_tiempo", scope: "global", descuentoPct: "", validHasta: "", stock: "" });
  const [, force] = useState(0); const rf = () => force(n => n + 1);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const crear = () => {
    if (!form.nombre || !form.descuentoPct) return showToast("Nombre y descuento obligatorios", "err");
    DB.promos.push({ id: "P" + Date.now(), nombre: form.nombre, desc: form.desc, tipo: form.tipo, scope: form.scope, descuentoPct: parseFloat(form.descuentoPct), validHasta: form.validHasta || null, stock: form.stock ? parseInt(form.stock) : null, stockUsado: 0, activa: true });
    setCreando(false); setForm({ nombre: "", desc: "", tipo: "por_tiempo", scope: "global", descuentoPct: "", validHasta: "", stock: "" }); rf(); showToast("Promo creada");
  };
  const toggle = id => { const p = DB.promos.find(p => p.id === id); p.activa = !p.activa; rf(); showToast(`Promo ${p.activa ? "activada" : "desactivada"}`); };
  const eliminar = id => { const i = DB.promos.findIndex(p => p.id === id); DB.promos.splice(i, 1); rf(); showToast("Promo eliminada"); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionTitle>Promos ({DB.promos.length})</SectionTitle>
        <button style={{ ...S.primaryBtn, width: "auto", padding: "10px 18px", marginTop: 24, fontSize: 13 }} onClick={() => setCreando(!creando)}>{creando ? "Cancelar" : "+ Nueva promo"}</button>
      </div>
      {creando && (
        <div style={{ ...S.formCard, marginBottom: 16 }}>
          <label style={S.label}>Nombre</label><input style={S.input} value={form.nombre} onChange={e => set("nombre", e.target.value)} />
          <label style={S.label}>Descripción</label><input style={S.input} value={form.desc} onChange={e => set("desc", e.target.value)} />
          <div style={S.grid2}>
            <div><label style={S.label}>Tipo</label><select style={S.select} value={form.tipo} onChange={e => set("tipo", e.target.value)}><option value="por_tiempo">Por tiempo</option><option value="por_stock">Por stock</option></select></div>
            <div><label style={S.label}>Alcance</label><select style={S.select} value={form.scope} onChange={e => set("scope", e.target.value)}><option value="global">Global</option><option value="local">Local</option></select></div>
            <div><label style={S.label}>Descuento (%)</label><input style={S.input} type="number" min="1" max="100" value={form.descuentoPct} onChange={e => set("descuentoPct", e.target.value)} /></div>
            {form.tipo === "por_tiempo" && <div><label style={S.label}>Válida hasta</label><input style={S.input} type="date" value={form.validHasta} onChange={e => set("validHasta", e.target.value)} /></div>}
            {form.tipo === "por_stock" && <div><label style={S.label}>Unidades</label><input style={S.input} type="number" min="1" value={form.stock} onChange={e => set("stock", e.target.value)} /></div>}
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={crear}>Crear promo</button>
        </div>
      )}
      {DB.promos.map(p => {
        const c = p.tipo === "por_stock" ? "#7C5CFC" : "#FF6B35";
        return (
          <div key={p.id} style={{ ...S.formCard, marginBottom: 10, borderLeft: `4px solid ${c}`, opacity: p.activa ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  <span style={S.promoName}>{p.nombre}</span>
                  <span style={{ ...S.badge, background: c }}>{p.tipo === "por_stock" ? "STOCK" : "TIEMPO"}</span>
                  <span style={{ ...S.badge, background: p.scope === "global" ? "#00C896" : "#FF6B35" }}>{p.scope.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 4 }}>{p.desc}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c }}>-{p.descuentoPct}%</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                <button style={{ ...S.adminBtn, background: p.activa ? "rgba(255,107,107,0.15)" : "rgba(0,200,150,0.15)", color: p.activa ? "#FF6B6B" : "#00C896" }} onClick={() => toggle(p.id)}>{p.activa ? "Desactivar" : "Activar"}</button>
                <button style={{ ...S.adminBtn, background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }} onClick={() => eliminar(p.id)}>🗑️</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ADMIN RECOMPENSAS (gestión completa de puntos) ───────────────────────────
function AdminRecompensas({ showToast }) {
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: "", emoji: "🎁", puntosReq: "", tipo: "cupon", desc: "", limiteXUsuario: "" });
  const [, force] = useState(0); const rf = () => force(n => n + 1);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const crear = () => {
    if (!form.nombre || !form.puntosReq) return showToast("Nombre y puntos obligatorios", "err");
    DB.recompensas.push({
      id: "R" + Date.now(), nombre: form.nombre, emoji: form.emoji,
      puntosReq: parseInt(form.puntosReq), tipo: form.tipo, desc: form.desc,
      limiteXUsuario: form.limiteXUsuario ? parseInt(form.limiteXUsuario) : null,
      activa: true,
    });
    setCreando(false); setForm({ nombre: "", emoji: "🎁", puntosReq: "", tipo: "cupon", desc: "", limiteXUsuario: "" }); rf(); showToast("Recompensa creada");
  };

  const guardarEdicion = (id, cambios) => {
    const idx = DB.recompensas.findIndex(r => r.id === id);
    Object.assign(DB.recompensas[idx], cambios); rf(); setEditando(null); showToast("Recompensa actualizada");
  };

  const toggle = id => { const r = DB.recompensas.find(r => r.id === id); r.activa = !r.activa; rf(); showToast(`Recompensa ${r.activa ? "activada" : "desactivada"}`); };
  const eliminar = id => { const i = DB.recompensas.findIndex(r => r.id === id); DB.recompensas.splice(i, 1); rf(); showToast("Recompensa eliminada"); };

  return (
    <div>
      <div style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 14, padding: 16, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#FFD700", marginBottom: 4 }}>⭐ Gestión del programa de puntos</div>
        <div style={{ fontSize: 13, color: "#8888bb" }}>
          Crea y edita recompensas, define cuántos puntos cuestan y cuántas veces puede canjearlas cada cliente.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionTitle>Recompensas ({DB.recompensas.length})</SectionTitle>
        <button style={{ ...S.primaryBtn, width: "auto", padding: "10px 18px", marginTop: 24, fontSize: 13 }}
          onClick={() => setCreando(!creando)}>{creando ? "Cancelar" : "+ Nueva recompensa"}</button>
      </div>

      {creando && (
        <div style={{ ...S.formCard, marginBottom: 16 }}>
          <div style={S.grid2}>
            <div><label style={S.label}>Emoji</label><input style={S.input} value={form.emoji} onChange={e => set("emoji", e.target.value)} /></div>
            <div><label style={S.label}>Nombre</label><input style={S.input} placeholder="Bebida gratis" value={form.nombre} onChange={e => set("nombre", e.target.value)} /></div>
            <div>
              <label style={S.label}>Tipo</label>
              <select style={S.select} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="cupon">Cupón de descuento</option>
                <option value="producto">Producto gratis</option>
              </select>
            </div>
            <div><label style={S.label}>Puntos requeridos</label><input style={S.input} type="number" min="1" placeholder="Ej: 100" value={form.puntosReq} onChange={e => set("puntosReq", e.target.value)} /></div>
            <div><label style={S.label}>Límite por usuario (vacío = sin límite)</label><input style={S.input} type="number" min="1" placeholder="Ej: 3" value={form.limiteXUsuario} onChange={e => set("limiteXUsuario", e.target.value)} /></div>
            <div><label style={S.label}>Descripción</label><input style={S.input} placeholder="Descripción de la recompensa" value={form.desc} onChange={e => set("desc", e.target.value)} /></div>
          </div>
          <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={crear}>Crear recompensa</button>
        </div>
      )}

      {DB.recompensas.map(r => {
        const totalCanjes = DB.usuarios.reduce((a, u) => {
          return a + (u.cuponesCanjeados || []).filter(c => c.recompensaId === r.id).length;
        }, 0);

        return (
          <div key={r.id} style={{ ...S.formCard, marginBottom: 10, opacity: r.activa ? 1 : 0.55 }}>
            {editando !== r.id ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4 }}>{r.nombre}</div>
                  <div style={{ fontSize: 12, color: "#8888bb", marginBottom: 4 }}>{r.desc}</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ ...S.badge, background: "#FF6B35" }}>{r.puntosReq} pts</span>
                    <span style={{ ...S.badge, background: r.tipo === "cupon" ? "#7C5CFC" : "#00C896" }}>{r.tipo.toUpperCase()}</span>
                    {r.limiteXUsuario !== null && <span style={{ ...S.badge, background: "#333366" }}>Límite: {r.limiteXUsuario}/usuario</span>}
                    <span style={{ ...S.badge, background: "#333333" }}>Canjeada {totalCanjes}x total</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button style={S.adminBtn} onClick={() => setEditando(r.id)}>✏️</button>
                  <button style={{ ...S.adminBtn, background: r.activa ? "rgba(255,107,107,0.15)" : "rgba(0,200,150,0.15)", color: r.activa ? "#FF6B6B" : "#00C896" }} onClick={() => toggle(r.id)}>{r.activa ? "🔴" : "🟢"}</button>
                  <button style={{ ...S.adminBtn, background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }} onClick={() => eliminar(r.id)}>🗑️</button>
                </div>
              </div>
            ) : (
              <EditRecompensaForm recompensa={r} onSave={c => guardarEdicion(r.id, c)} onCancel={() => setEditando(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditRecompensaForm({ recompensa, onSave, onCancel }) {
  const [f, setF] = useState({ nombre: recompensa.nombre, emoji: recompensa.emoji, puntosReq: recompensa.puntosReq, tipo: recompensa.tipo, desc: recompensa.desc, limiteXUsuario: recompensa.limiteXUsuario ?? "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div>
      <div style={S.grid2}>
        <div><label style={S.label}>Emoji</label><input style={S.input} value={f.emoji} onChange={e => set("emoji", e.target.value)} /></div>
        <div><label style={S.label}>Nombre</label><input style={S.input} value={f.nombre} onChange={e => set("nombre", e.target.value)} /></div>
        <div><label style={S.label}>Puntos requeridos</label><input style={S.input} type="number" value={f.puntosReq} onChange={e => set("puntosReq", e.target.value)} /></div>
        <div><label style={S.label}>Tipo</label><select style={S.select} value={f.tipo} onChange={e => set("tipo", e.target.value)}><option value="cupon">Cupón</option><option value="producto">Producto</option></select></div>
        <div><label style={S.label}>Límite/usuario (vacío=sin límite)</label><input style={S.input} type="number" value={f.limiteXUsuario} onChange={e => set("limiteXUsuario", e.target.value)} /></div>
        <div><label style={S.label}>Descripción</label><input style={S.input} value={f.desc} onChange={e => set("desc", e.target.value)} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button style={{ ...S.primaryBtn, marginTop: 0, flex: 1 }} onClick={() => onSave({ ...f, puntosReq: parseInt(f.puntosReq), limiteXUsuario: f.limiteXUsuario ? parseInt(f.limiteXUsuario) : null })}>Guardar</button>
        <button style={{ ...S.dangerBtn, marginTop: 0, flex: 0.4 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function AdminClientes() {
  const [busq, setBusq] = useState("");
  const clientes = DB.usuarios.filter(u => u.role === "cliente");
  const filtrados = clientes.filter(u => !busq || u.name?.toLowerCase().includes(busq.toLowerCase()) || u.email?.toLowerCase().includes(busq.toLowerCase()));
  return (
    <div>
      <SectionTitle>Clientes ({clientes.length})</SectionTitle>
      <input style={{ ...S.input, marginBottom: 16 }} placeholder="Buscar por nombre o email..." value={busq} onChange={e => setBusq(e.target.value)} />
      {filtrados.length === 0 && <div style={S.emptyState}>{clientes.length === 0 ? "Sin clientes aún" : "Sin resultados"}</div>}
      {filtrados.map(c => {
        const reseñas = DB.platos.filter(p => DB.yaReseñó(p.id, c.id)).length;
        const canjes = (c.cuponesCanjeados || []).length;
        const pedidos = (c.pedidos || []).length;
        return (
          <div key={c.id} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 14, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#FF6B35,#FF3CAC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {(c.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#8888bb" }}>{c.email} · {c.country || "—"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#FF6B35" }}>{(c.points || 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#8888bb" }}>puntos</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, borderTop: "1px solid #2a2a4a", paddingTop: 10 }}>
              {[["📋", "Pedidos", pedidos], ["📝", "Reseñas", reseñas], ["🎟️", "Canjes", canjes]].map(([icon, label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e8e8f0" }}>{icon} {val}</div>
                  <div style={{ fontSize: 10, color: "#6666aa", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminPedidos() {
  const [filtro, setFiltro] = useState("todos");
  const pedidos = filtro === "todos" ? DB.pedidosSede : DB.pedidosSede.filter(p => p.estado === filtro);
  const colores = { completado: "#00C896", en_proceso: "#FF6B35", cancelado: "#FF6B6B" };
  return (
    <div>
      <SectionTitle>Pedidos de la sede ({DB.pedidosSede.length})</SectionTitle>
      <div style={{ ...S.tabRow, marginBottom: 16 }}>
        {[["todos", "Todos"], ["completado", "Completados"], ["en_proceso", "En proceso"]].map(([id, label]) => (
          <button key={id} style={{ ...S.tabBtn, ...(filtro === id ? S.tabBtnActive : {}) }} onClick={() => setFiltro(id)}>{label}</button>
        ))}
      </div>
      {pedidos.length === 0 && <div style={S.emptyState}>Sin pedidos</div>}
      {[...pedidos].reverse().map(p => (
        <div key={p.id} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 14, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#FF6B35" }}>{p.id}</span>
            <span style={{ fontSize: 12, color: "#8888bb" }}>{p.fecha}</span>
          </div>
          <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 4 }}>👤 {p.clienteNombre}</div>
          <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 10 }}>{p.items}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0" }}>${p.total.toFixed(2)}</span>
            <span style={{ ...S.badge, background: colores[p.estado] || "#666" }}>{p.estado.replace("_", " ").toUpperCase()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RATING MODAL ─────────────────────────────────────────────────────────────
function RatingModal({ plato, userId, yaReseñó, onSubmit, onClose }) {
  const [stars, setStars] = useState(0);
  const [comentario, setComentario] = useState("");
  const rating = DB.getRating(plato.id);
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{plato.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{plato.nombre}</div>
        {rating && <div style={{ fontSize: 13, color: "#8888bb", marginBottom: 16 }}>Valoración actual: ⭐ {rating}</div>}
        {yaReseñó ? (
          <div style={{ fontSize: 14, color: "#8888bb", padding: "16px 0" }}>✅ Ya enviaste tu valoración</div>
        ) : (<>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, transform: stars >= s ? "scale(1.15)" : "scale(1)", transition: "transform 0.1s" }} onClick={() => setStars(s)}>
                <span style={{ fontSize: 34, opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
              </button>
            ))}
          </div>
          <textarea style={{ ...S.input, height: 80, resize: "none", fontFamily: "inherit" }} placeholder="Comentario opcional..." value={comentario} onChange={e => setComentario(e.target.value)} />
          <button style={{ ...S.primaryBtn, opacity: stars === 0 ? 0.4 : 1, marginTop: 12 }} onClick={() => stars > 0 && onSubmit(plato.id, stars, comentario)}>Enviar valoración ⭐</button>
        </>)}
        <button style={{ background: "none", border: "none", color: "#8888bb", fontSize: 13, cursor: "pointer", marginTop: 12 }} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

function SectionTitle({ children }) { return <div style={S.sectionTitle}>{children}</div>; }
function Toast({ msg, type }) { return <div style={{ ...S.toast, background: type === "err" ? "#c0392b" : "#1a1a2e" }}>{type === "err" ? "⚠️" : "✅"} {msg}</div>; }

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#0f0f1a", color: "#e8e8f0", fontFamily: "'Outfit','Segoe UI',sans-serif", display: "flex", flexDirection: "column" },
  authPage: { minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  authContainer: { display: "flex", width: "100%", maxWidth: 900, minHeight: 540, background: "#1a1a2e", borderRadius: 24, border: "1px solid #2a2a4a", overflow: "hidden" },
  authLeft: { flex: 1, minWidth: 260, background: "linear-gradient(145deg,#16213e,#0f3460)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  authLogo: { width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#FF6B35,#FF3CAC)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 20 },
  authLogoMobile: { width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#FF6B35,#FF3CAC)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 20px" },
  authBrandTitle: { fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 10px" },
  authBrandSub: { fontSize: 14, color: "#8888bb", lineHeight: 1.6, margin: 0 },
  authRight: { flex: 1, padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 300 },
  onboardingCard: { background: "#1a1a2e", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 440, border: "1px solid #2a2a4a" },
  tabRow: { display: "flex", background: "#0f0f1a", borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
  tabBtn: { flex: 1, padding: "10px 8px", background: "none", border: "none", color: "#8888bb", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 9 },
  tabBtnActive: { background: "#1a1a2e", color: "#fff" },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#8888bb", marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 1 },
  input: { width: "100%", padding: "12px 14px", background: "#0f0f1a", color: "#e8e8f0", border: "1px solid #2a2a4a", borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "12px 14px", background: "#0f0f1a", color: "#e8e8f0", border: "1px solid #2a2a4a", borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box" },
  roleRow: { display: "flex", gap: 10, marginTop: 8 },
  roleBtn: { flex: 1, padding: 10, background: "#0f0f1a", color: "#8888bb", border: "1px solid #2a2a4a", borderRadius: 10, fontSize: 13, cursor: "pointer" },
  roleBtnActive: { background: "rgba(255,107,53,0.15)", color: "#FF6B35", border: "1px solid rgba(255,107,53,0.4)" },
  primaryBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#FF6B35,#FF3CAC)", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: "#1a1a2e", borderBottom: "1px solid #2a2a4a", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#FF6B35,#FF3CAC)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" },
  headerTitle: { fontWeight: 700, fontSize: 16, color: "#fff" },
  headerSub: { fontSize: 11, color: "#8888bb", marginTop: 1 },
  pointsBadge: { display: "flex", alignItems: "center", gap: 5, background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 20, padding: "5px 12px" },
  pointsNum: { fontSize: 13, fontWeight: 700, color: "#FF6B35" },
  cartBadge: { background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.4)", borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 700, color: "#FF6B35", cursor: "pointer" },
  main: { flex: 1, overflowY: "auto", paddingBottom: 80 },
  mainInner: { maxWidth: 1100, margin: "0 auto", padding: 24, boxSizing: "border-box" },
  nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#12121f", borderTop: "1px solid #2a2a4a", padding: "6px 0", zIndex: 10 },
  navInner: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "center" },
  navBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 14px", background: "none", border: "none", cursor: "pointer", borderRadius: 8 },
  navBtnActive: { background: "rgba(255,107,53,0.1)" },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 10, color: "#8888bb" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#8888bb", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12, marginTop: 24 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 },
  welcomeCard: { display: "flex", alignItems: "center", gap: 16, background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 16, padding: "20px 24px", border: "1px solid #2a2a4a" },
  welcomeName: { fontWeight: 700, fontSize: 20, color: "#fff" },
  statCard: { background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 14, padding: 20, textAlign: "center" },
  dishCard: { display: "flex", alignItems: "center", gap: 12, background: "#1a1a2e", borderRadius: 12, padding: "14px 16px", border: "1px solid #2a2a4a" },
  dishName: { fontWeight: 600, fontSize: 14, color: "#e8e8f0" },
  rateBtn: { background: "rgba(255,107,53,0.15)", color: "#FF6B35", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)", color: "#FF6B35", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  promoCard: { background: "#1a1a2e", borderRadius: 12, padding: 16 },
  promoName: { fontWeight: 700, fontSize: 15, color: "#fff" },
  badge: { fontSize: 10, fontWeight: 800, color: "#fff", padding: "3px 8px", borderRadius: 6, letterSpacing: 0.5 },
  orderCard: { background: "#1a1a2e", borderRadius: 12, padding: 16, border: "1px solid #2a2a4a" },
  rewardCard: { background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 20, textAlign: "center" },
  pointsCard: { background: "linear-gradient(135deg,#1a1a2e,#16213e)", border: "1px solid #2a2a4a", borderRadius: 20, padding: 28, textAlign: "center" },
  progressBar: { background: "#2a2a4a", borderRadius: 100, height: 6, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg,#FF6B35,#FF3CAC)", borderRadius: 100, transition: "width 0.4s" },
  txRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #1e1e3a" },
  profileHeader: { display: "flex", alignItems: "center", gap: 16, background: "#1a1a2e", borderRadius: 16, padding: 20, border: "1px solid #2a2a4a", marginBottom: 4 },
  avatar: { width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#FF6B35,#FF3CAC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", flexShrink: 0 },
  infoRow: { display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid #1e1e3a" },
  dangerBtn: { width: "100%", padding: 13, background: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 24 },
  formCard: { background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 14, padding: 16 },
  adminBtn: { padding: "8px 12px", background: "rgba(255,107,53,0.1)", color: "#FF6B35", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  emptyState: { textAlign: "center", padding: "32px 20px", color: "#4444aa", fontSize: 14, background: "#1a1a2e", borderRadius: 12, border: "1px solid #2a2a4a" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 },
  modal: { background: "#1a1a2e", borderRadius: 24, padding: "36px 28px", width: "100%", maxWidth: 400, textAlign: "center", border: "1px solid #2a2a4a" },
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "11px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", whiteSpace: "nowrap" },
};