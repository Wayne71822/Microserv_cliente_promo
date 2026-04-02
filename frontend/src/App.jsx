/**
 * RestoHub - Frontend Cliente
 * Correcciones:
 * - Responsive: se ve bien en móvil Y escritorio
 * - Login simulado funcional
 * - Logout cierra sesión sin recargar
 */

import { useState } from "react";

// ─── BASE DE USUARIOS EN MEMORIA ──────────────────────────────────────────────
// Simula la base de datos del Customer Service.
// Cuando Auth0 esté integrado, esto desaparece y el JWT lo maneja el Gateway.
const usuariosRegistrados = [];

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_HISTORY = [
  { id: "ORD-001", date: "2026-03-28", total: 32.5, items: "Pasta Carbonara, Limonada" },
  { id: "ORD-002", date: "2026-03-25", total: 18.0, items: "Pizza Margherita" },
  { id: "ORD-003", date: "2026-03-20", total: 45.0, items: "Chuletón, Vino Tinto, Tiramisú" },
];

const MOCK_POINT_HISTORY = [
  { id: 1, delta: +32, desc: "Puntos por pedido ORD-001", date: "Mar 28" },
  { id: 2, delta: +18, desc: "Puntos por pedido ORD-002", date: "Mar 25" },
  { id: 3, delta: -200, desc: "Canje en pedido ORD-002", date: "Mar 25" },
  { id: 4, delta: +45, desc: "Puntos por pedido ORD-003", date: "Mar 20" },
];

const MOCK_PROMOS = [
  { id: "P1", name: "Lunes de Pasta", desc: "20% en todos los platos de pasta", badge: "TIEMPO", color: "#FF6B35" },
  { id: "P2", name: "Promo Bienvenida", desc: "10% en tu primer pedido del mes", badge: "GLOBAL", color: "#00C896" },
  { id: "P3", name: "Stock Limitado", desc: "Postre del día a mitad de precio (solo 15 unidades)", badge: "STOCK", color: "#7C5CFC" },
];

const MOCK_ADMIN_SEARCH = {
  "cliente123": { name: "Carlos Mendoza", points: 1240, history: MOCK_POINT_HISTORY },
  "cliente456": {
    name: "Ana García", points: 580, history: [
      { id: 1, delta: +50, desc: "Puntos por pedido ORD-010", date: "Mar 29" },
      { id: 2, delta: -100, desc: "Canje en pedido ORD-011", date: "Mar 27" },
    ]
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

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [authTab, setAuthTab] = useState("login");
  const [user, setUser] = useState(null);
  const [country, setCountry] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [toast, setToast] = useState(null);
  const [ratingDish, setRatingDish] = useState(null);
  const [stars, setStars] = useState(0);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ── REGISTRO ────────────────────────────────────────────────────────────────
  const handleRegister = (userData) => {
    const existe = usuariosRegistrados.find(u => u.email === userData.email);
    if (existe) return showToast("Este email ya está registrado", "err");
    const nuevoUsuario = { ...userData, id: "auth0|" + Date.now(), points: 0 };
    usuariosRegistrados.push(nuevoUsuario);
    setUser(nuevoUsuario);
    setScreen("onboarding");
    showToast("¡Cuenta creada exitosamente!");
  };

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  // En producción: reemplazar por Auth0 SDK → JWT → Gateway lo valida
  const handleLogin = (email, password) => {
    const encontrado = usuariosRegistrados.find(
      u => u.email === email && u.password === password
    );
    if (!encontrado) return showToast("Email o contraseña incorrectos", "err");
    setUser(encontrado);
    if (encontrado.country) {
      setCountry(encontrado.country);
      setRestaurant(encontrado.restaurant || "");
      setScreen("home");
    } else {
      setScreen("onboarding");
    }
    showToast(`¡Bienvenido de nuevo, ${encontrado.name.split(" ")[0]}!`);
  };

  // ── ONBOARDING ──────────────────────────────────────────────────────────────
  const handleOnboarding = () => {
    if (!country || !restaurant) return showToast("Selecciona país y restaurante", "err");
    const idx = usuariosRegistrados.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      usuariosRegistrados[idx].country = country;
      usuariosRegistrados[idx].restaurant = restaurant;
    }
    setUser(prev => ({ ...prev, country, restaurant }));
    setScreen("home");
    showToast(`¡Bienvenido a ${restaurant}!`);
  };

  // ── LOGOUT CORREGIDO ─────────────────────────────────────────────────────────
  // Resetea todos los estados sin recargar la página
  const handleLogout = () => {
    setUser(null);
    setCountry("");
    setRestaurant("");
    setActiveTab("home");
    setScreen("auth");
    setAuthTab("login");
    showToast("Sesión cerrada correctamente");
  };

  if (screen === "auth") {
    return <AuthScreen authTab={authTab} setAuthTab={setAuthTab}
      onLogin={handleLogin} onRegister={handleRegister}
      toast={toast} showToast={showToast} />;
  }

  if (screen === "onboarding") {
    return <OnboardingScreen user={user}
      country={country} setCountry={setCountry}
      restaurant={restaurant} setRestaurant={setRestaurant}
      onStart={handleOnboarding} toast={toast} />;
  }

  return (
    <div style={S.app}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}>RH</div>
          <div>
            <div style={S.headerTitle}>RestoHub</div>
            <div style={S.headerSub}>{restaurant}</div>
          </div>
        </div>
        <div style={S.pointsBadge}>
          <span>⭐</span>
          <span style={S.pointsNum}>{(user?.points || 0).toLocaleString()} pts</span>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.mainInner}>
          {activeTab === "home" && <HomeTab showToast={showToast} setRatingDish={setRatingDish} user={user} />}
          {activeTab === "promos" && <PromosTab promos={MOCK_PROMOS} showToast={showToast} />}
          {activeTab === "history" && <HistoryTab orders={MOCK_HISTORY} />}
          {activeTab === "points" && <PointsTab points={user?.points || 0} history={MOCK_POINT_HISTORY} />}
          {activeTab === "profile" && <ProfileTab user={user} country={country} restaurant={restaurant} onLogout={handleLogout} />}
          {activeTab === "admin" && user?.role === "admin" && <AdminTab showToast={showToast} />}
        </div>
      </main>

      {ratingDish && (
        <RatingModal dish={ratingDish} stars={stars} setStars={setStars}
          onSubmit={() => { showToast(`¡Valoración enviada! ${stars}⭐`); setRatingDish(null); setStars(0); }}
          onClose={() => { setRatingDish(null); setStars(0); }} />
      )}

      <nav style={S.nav}>
        <div style={S.navInner}>
          {[
            { id: "home", icon: "🏠", label: "Inicio" },
            { id: "promos", icon: "🎁", label: "Promos" },
            { id: "history", icon: "📋", label: "Pedidos" },
            { id: "points", icon: "⭐", label: "Puntos" },
            { id: "profile", icon: "👤", label: "Perfil" },
            ...(user?.role === "admin" ? [{ id: "admin", icon: "🔧", label: "Admin" }] : []),
          ].map(tab => (
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

// ─── PANTALLA AUTH ────────────────────────────────────────────────────────────
function AuthScreen({ authTab, setAuthTab, onLogin, onRegister, toast, showToast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cliente" });

  const handleSubmit = () => {
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

        {/* Panel izquierdo — solo en escritorio */}
        <div style={S.authLeft}>
          <div>
            <div style={S.authLogo}>RH</div>
            <h1 style={S.authBrandTitle}>RestoHub</h1>
            <p style={S.authBrandSub}>
              Sistema de gestión unificado para cadenas de restaurantes multinacionales
            </p>
          </div>
          <div style={S.authFeatures}>
            {[
              { icon: "🌍", text: "Operaciones en 7 países" },
              { icon: "🍽️", text: "200+ restaurantes conectados" },
              { icon: "⭐", text: "Programa de fidelización" },
              { icon: "🎁", text: "Promociones en tiempo real" },
            ].map((f, i) => (
              <div key={i} style={S.authFeatureItem}>
                <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: "#aaaacc" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div style={S.authRight}>
          <div style={S.authLogoMobile}>RH</div>

          <div style={S.tabRow}>
            <button style={{ ...S.tabBtn, ...(authTab === "login" ? S.tabBtnActive : {}) }}
              onClick={() => setAuthTab("login")}>Iniciar sesión</button>
            <button style={{ ...S.tabBtn, ...(authTab === "register" ? S.tabBtnActive : {}) }}
              onClick={() => setAuthTab("register")}>Crear cuenta</button>
          </div>

          {authTab === "register" && (
            <>
              <label style={S.label}>Nombre completo</label>
              <input style={S.input} placeholder="Carlos Mendoza"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </>
          )}

          <label style={S.label}>Correo electrónico</label>
          <input style={S.input} type="email" placeholder="correo@email.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

          <label style={S.label}>Contraseña</label>
          <input style={S.input} type="password"
            placeholder={authTab === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />

          {authTab === "register" && (
            <>
              <label style={S.label}>Tipo de cuenta</label>
              <div style={S.roleRow}>
                {["cliente", "admin"].map(r => (
                  <button key={r}
                    style={{ ...S.roleBtn, ...(form.role === r ? S.roleBtnActive : {}) }}
                    onClick={() => setForm({ ...form, role: r })}>
                    {r === "cliente" ? "👤 Cliente" : "🔧 Admin"}
                  </button>
                ))}
              </div>
            </>
          )}

          <button style={S.primaryBtn} onClick={handleSubmit}>
            {authTab === "login" ? "Iniciar sesión →" : "Crear cuenta →"}
          </button>

          {authTab === "login" && (
            <p style={{ fontSize: 13, color: "#8888bb", textAlign: "center", marginTop: 14 }}>
              ¿No tienes cuenta?{" "}
              <span style={{ color: "#FF6B35", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => setAuthTab("register")}>
                Regístrate gratis
              </span>
            </p>
          )}

          <p style={{ fontSize: 12, color: "#4444aa", textAlign: "center", marginTop: 12 }}>
            🔒 Autenticación segura con Auth0
          </p>
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
        <h1 style={{ ...S.authBrandTitle, marginTop: 16 }}>
          ¡Hola, {user?.name?.split(" ")[0]}!
        </h1>
        <p style={S.authBrandSub}>¿Dónde estás hoy?</p>

        <label style={S.label}>País</label>
        <select style={S.select} value={country}
          onChange={e => { setCountry(e.target.value); setRestaurant(""); }}>
          <option value="">Selecciona tu país...</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {country && (
          <>
            <label style={S.label}>Restaurante</label>
            <select style={S.select} value={restaurant}
              onChange={e => setRestaurant(e.target.value)}>
              <option value="">Selecciona restaurante...</option>
              {RESTAURANTS[country]?.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </>
        )}

        <button style={{ ...S.primaryBtn, opacity: (!country || !restaurant) ? 0.4 : 1 }}
          onClick={onStart}>
          Entrar al sistema →
        </button>
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function HomeTab({ showToast, setRatingDish, user }) {
  const dishes = [
    { id: "D1", name: "Pasta Carbonara", rating: 4.8, emoji: "🍝" },
    { id: "D2", name: "Pizza Margherita", rating: 4.5, emoji: "🍕" },
    { id: "D3", name: "Chuletón Ibérico", rating: 4.9, emoji: "🥩" },
  ];
  return (
    <div>
      <div style={S.welcomeCard}>
        <div style={{ fontSize: 36 }}>👋</div>
        <div>
          <div style={S.welcomeName}>Hola, {user?.name?.split(" ")[0] || "Cliente"}</div>
          <div style={{ fontSize: 14, color: "#8888bb", marginTop: 4 }}>¿Listo para pedir hoy?</div>
        </div>
      </div>

      <SectionTitle>Valorar platos recientes</SectionTitle>
      <div style={S.grid2}>
        {dishes.map(dish => (
          <div key={dish.id} style={S.dishCard}>
            <span style={{ fontSize: 28 }}>{dish.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={S.dishName}>{dish.name}</div>
              <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>⭐ {dish.rating}</div>
            </div>
            <button style={S.rateBtn} onClick={() => setRatingDish(dish)}>Valorar</button>
          </div>
        ))}
      </div>

      <SectionTitle>Acceso rápido</SectionTitle>
      <div style={S.quickGrid}>
        {[
          { icon: "🛒", label: "Nuevo pedido" },
          { icon: "🎁", label: "Ver promos" },
          { icon: "📍", label: "Mi restaurante" },
          { icon: "📊", label: "Estadísticas" },
        ].map((q, i) => (
          <button key={i} style={S.quickCard} onClick={() => showToast(q.label)}>
            <span style={{ fontSize: 26 }}>{q.icon}</span>
            <span style={S.quickLabel}>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PromosTab({ promos, showToast }) {
  return (
    <div>
      <SectionTitle>Promociones activas</SectionTitle>
      <p style={{ fontSize: 12, color: "#6666aa", marginBottom: 16, marginTop: -8 }}>
        Se aplican automáticamente al realizar un pedido
      </p>
      <div style={S.grid2}>
        {promos.map(promo => (
          <div key={promo.id} style={{ ...S.promoCard, borderLeft: `4px solid ${promo.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={S.promoName}>{promo.name}</div>
              <span style={{ ...S.promoBadge, background: promo.color }}>{promo.badge}</span>
            </div>
            <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 12 }}>{promo.desc}</div>
            <button style={{ color: promo.color, background: "none", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
              onClick={() => showToast(`Promo "${promo.name}" guardada`)}>
              Guardar ♡
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ orders }) {
  return (
    <div>
      <SectionTitle>Historial de pedidos</SectionTitle>
      <div style={S.grid2}>
        {orders.map(order => (
          <div key={order.id} style={S.orderCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#FF6B35" }}>{order.id}</span>
              <span style={{ fontSize: 12, color: "#8888bb" }}>{order.date}</span>
            </div>
            <div style={{ fontSize: 13, color: "#aaaacc", marginBottom: 12 }}>{order.items}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0" }}>${order.total.toFixed(2)}</span>
              <span style={{ fontSize: 12, color: "#00C896" }}>✅ Completado</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointsTab({ points, history }) {
  const progressPct = Math.min((points % 500) / 500 * 100, 100);
  return (
    <div>
      <div style={S.pointsCard}>
        <div style={{ fontSize: 12, color: "#8888bb", textTransform: "uppercase", letterSpacing: 1 }}>Mis puntos</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: "#FF6B35", margin: "8px 0 4px" }}>{points.toLocaleString()}</div>
        <div style={{ fontSize: 14, color: "#aaaacc", marginBottom: 16 }}>⭐ puntos de fidelización</div>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${progressPct}%` }} />
        </div>
        <div style={{ fontSize: 12, color: "#8888bb", marginTop: 10 }}>
          Te faltan <b>{500 - (points % 500)}</b> pts para tu próxima recompensa
        </div>
      </div>
      <SectionTitle>Movimientos</SectionTitle>
      {history.map(tx => (
        <div key={tx.id} style={S.txRow}>
          <div>
            <div style={{ fontSize: 13, color: "#e8e8f0" }}>{tx.desc}</div>
            <div style={{ fontSize: 11, color: "#6666aa", marginTop: 3 }}>{tx.date}</div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: tx.delta > 0 ? "#00C896" : "#FF6B6B" }}>
            {tx.delta > 0 ? "+" : ""}{tx.delta} pts
          </span>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ user, country, restaurant, onLogout }) {
  return (
    <div>
      <div style={S.profileHeader}>
        <div style={S.avatar}>{(user?.name || "U")[0]}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: "#8888bb", marginTop: 3 }}>{user?.email}</div>
          <span style={{ ...S.promoBadge, background: user?.role === "admin" ? "#7C5CFC" : "#00C896", display: "inline-block", marginTop: 6 }}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
      </div>
      <SectionTitle>Mi información</SectionTitle>
      {[
        { label: "País", value: country || "No seleccionado", icon: "🌍" },
        { label: "Restaurante", value: restaurant || "No seleccionado", icon: "🏪" },
        { label: "Puntos", value: `${(user?.points || 0).toLocaleString()} pts`, icon: "⭐" },
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

function AdminTab({ showToast }) {
  const [searchId, setSearchId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!searchId.trim()) return showToast("Ingresa un ID de cliente", "err");
    setLoading(true);
    setTimeout(() => {
      const found = MOCK_ADMIN_SEARCH[searchId.trim()];
      found ? setResult({ id: searchId.trim(), ...found }) : showToast("Cliente no encontrado", "err");
      setLoading(false);
    }, 600);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.3)", borderRadius: 16, padding: "16px 18px" }}>
        <span style={{ fontSize: 32 }}>🔧</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Panel Admin</div>
          <div style={{ fontSize: 12, color: "#8888bb", marginTop: 2 }}>Consulta puntos de cualquier cliente</div>
        </div>
      </div>
      <SectionTitle>Buscar cliente por ID</SectionTitle>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="cliente123 o cliente456"
          value={searchId} onChange={e => setSearchId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()} />
        <button style={{ padding: "12px 16px", background: "linear-gradient(135deg, #FF6B35, #FF3CAC)", border: "none", borderRadius: 12, fontSize: 18, cursor: "pointer" }}
          onClick={handleSearch}>{loading ? "..." : "🔍"}</button>
      </div>
      {result && (
        <>
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 16, marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7C5CFC, #FF3CAC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>
              {result.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{result.name}</div>
              <div style={{ fontSize: 11, color: "#8888bb" }}>ID: {result.id}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#FF6B35" }}>{result.points.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#8888bb" }}>puntos</div>
            </div>
          </div>
          <SectionTitle>Historial</SectionTitle>
          {result.history.map(tx => (
            <div key={tx.id} style={S.txRow}>
              <div>
                <div style={{ fontSize: 13, color: "#e8e8f0" }}>{tx.desc}</div>
                <div style={{ fontSize: 11, color: "#6666aa", marginTop: 3 }}>{tx.date}</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: tx.delta > 0 ? "#00C896" : "#FF6B6B" }}>
                {tx.delta > 0 ? "+" : ""}{tx.delta} pts
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function RatingModal({ dish, stars, setStars, onSubmit, onClose }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{dish.emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 20 }}>{dish.name}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} onClick={() => setStars(s)}>
              <span style={{ fontSize: 36, opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
            </button>
          ))}
        </div>
        <button style={{ ...S.primaryBtn, opacity: stars === 0 ? 0.4 : 1, marginTop: 20 }}
          onClick={stars > 0 ? onSubmit : undefined}>
          Enviar valoración
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={S.sectionTitle}>{children}</div>;
}

function Toast({ msg, type }) {
  return (
    <div style={{ ...S.toast, background: type === "err" ? "#c0392b" : "#1a1a2e" }}>
      {type === "err" ? "⚠️" : "✅"} {msg}
    </div>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh", background: "#0f0f1a", color: "#e8e8f0",
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
    display: "flex", flexDirection: "column",
  },
  authPage: {
    minHeight: "100vh", background: "#0f0f1a",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  authContainer: {
    display: "flex", width: "100%", maxWidth: 900,
    minHeight: 540, background: "#1a1a2e",
    borderRadius: 24, border: "1px solid #2a2a4a", overflow: "hidden",
  },
  authLeft: {
    flex: 1, minWidth: 260,
    background: "linear-gradient(145deg, #16213e, #0f3460)",
    padding: "48px 40px",
    display: "flex", flexDirection: "column", justifyContent: "space-between",
  },
  authLogo: {
    width: 56, height: 56, borderRadius: 16,
    background: "linear-gradient(135deg, #FF6B35, #FF3CAC)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 20,
  },
  authLogoMobile: {
    width: 48, height: 48, borderRadius: 14,
    background: "linear-gradient(135deg, #FF6B35, #FF3CAC)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 20px",
  },
  authBrandTitle: { fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 10px" },
  authBrandSub: { fontSize: 14, color: "#8888bb", lineHeight: 1.6, margin: 0 },
  authFeatures: { display: "flex", flexDirection: "column", gap: 14 },
  authFeatureItem: { display: "flex", alignItems: "center", gap: 12 },
  authRight: {
    flex: 1, padding: "40px 36px",
    display: "flex", flexDirection: "column", justifyContent: "center",
    minWidth: 300,
  },
  onboardingCard: {
    background: "#1a1a2e", borderRadius: 24, padding: "40px 36px",
    width: "100%", maxWidth: 440, border: "1px solid #2a2a4a",
  },
  tabRow: {
    display: "flex", background: "#0f0f1a",
    borderRadius: 12, padding: 4, marginBottom: 24, gap: 4,
  },
  tabBtn: {
    flex: 1, padding: "10px 8px", background: "none",
    border: "none", color: "#8888bb", fontSize: 14,
    fontWeight: 600, cursor: "pointer", borderRadius: 9,
  },
  tabBtnActive: { background: "#1a1a2e", color: "#fff" },
  label: {
    display: "block", fontSize: 11, fontWeight: 700, color: "#8888bb",
    marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 1,
  },
  input: {
    width: "100%", padding: "12px 14px", background: "#0f0f1a", color: "#e8e8f0",
    border: "1px solid #2a2a4a", borderRadius: 12, fontSize: 14,
    outline: "none", boxSizing: "border-box",
  },
  select: {
    width: "100%", padding: "12px 14px", background: "#0f0f1a", color: "#e8e8f0",
    border: "1px solid #2a2a4a", borderRadius: 12, fontSize: 14,
    outline: "none", boxSizing: "border-box",
  },
  roleRow: { display: "flex", gap: 10, marginTop: 8 },
  roleBtn: {
    flex: 1, padding: 10, background: "#0f0f1a", color: "#8888bb",
    border: "1px solid #2a2a4a", borderRadius: 10, fontSize: 13, cursor: "pointer",
  },
  roleBtnActive: {
    background: "rgba(255,107,53,0.15)", color: "#FF6B35",
    border: "1px solid rgba(255,107,53,0.4)",
  },
  primaryBtn: {
    width: "100%", padding: 14,
    background: "linear-gradient(135deg, #FF6B35, #FF3CAC)",
    color: "#fff", border: "none", borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 20,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 24px", background: "#1a1a2e", borderBottom: "1px solid #2a2a4a",
    position: "sticky", top: 0, zIndex: 10,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg, #FF6B35, #FF3CAC)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 13, color: "#fff",
  },
  headerTitle: { fontWeight: 700, fontSize: 16, color: "#fff" },
  headerSub: { fontSize: 11, color: "#8888bb", marginTop: 1 },
  pointsBadge: {
    display: "flex", alignItems: "center", gap: 5,
    background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)",
    borderRadius: 20, padding: "5px 12px",
  },
  pointsNum: { fontSize: 13, fontWeight: 700, color: "#FF6B35" },
  main: { flex: 1, overflowY: "auto", paddingBottom: 80 },
  mainInner: { maxWidth: 1100, margin: "0 auto", padding: "24px 24px", boxSizing: "border-box" },
  nav: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#12121f", borderTop: "1px solid #2a2a4a",
    padding: "6px 0", zIndex: 10,
  },
  navInner: {
    maxWidth: 1100, margin: "0 auto",
    display: "flex", justifyContent: "center",
  },
  navBtn: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 3, padding: "6px 20px", background: "none",
    border: "none", cursor: "pointer", borderRadius: 8,
  },
  navBtnActive: { background: "rgba(255,107,53,0.1)" },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: "#8888bb" },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: "#8888bb",
    textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12, marginTop: 24,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
  },
  welcomeCard: {
    display: "flex", alignItems: "center", gap: 16,
    background: "linear-gradient(135deg, #1a1a2e, #16213e)",
    borderRadius: 16, padding: "20px 24px", border: "1px solid #2a2a4a",
  },
  welcomeName: { fontWeight: 700, fontSize: 20, color: "#fff" },
  dishCard: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#1a1a2e", borderRadius: 12, padding: "14px 16px",
    border: "1px solid #2a2a4a",
  },
  dishName: { fontWeight: 600, fontSize: 14, color: "#e8e8f0" },
  rateBtn: {
    background: "rgba(255,107,53,0.15)", color: "#FF6B35",
    border: "1px solid rgba(255,107,53,0.3)", borderRadius: 8,
    padding: "7px 12px", fontSize: 12, fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 12, marginTop: 8,
  },
  quickCard: {
    background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 14,
    padding: "20px 8px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 10, cursor: "pointer",
  },
  quickLabel: { fontSize: 12, color: "#8888bb", textAlign: "center" },
  promoCard: { background: "#1a1a2e", borderRadius: 12, padding: 16 },
  promoName: { fontWeight: 700, fontSize: 15, color: "#fff" },
  promoBadge: {
    fontSize: 10, fontWeight: 800, color: "#fff",
    padding: "3px 8px", borderRadius: 6, letterSpacing: 0.5,
  },
  orderCard: { background: "#1a1a2e", borderRadius: 12, padding: 16, border: "1px solid #2a2a4a" },
  pointsCard: {
    background: "linear-gradient(135deg, #1a1a2e, #16213e)",
    border: "1px solid #2a2a4a", borderRadius: 20, padding: 28, textAlign: "center",
  },
  progressBar: { background: "#2a2a4a", borderRadius: 100, height: 6, overflow: "hidden" },
  progressFill: {
    height: "100%", background: "linear-gradient(90deg, #FF6B35, #FF3CAC)",
    borderRadius: 100, transition: "width 0.4s",
  },
  txRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "13px 0", borderBottom: "1px solid #1e1e3a",
  },
  profileHeader: {
    display: "flex", alignItems: "center", gap: 16,
    background: "#1a1a2e", borderRadius: 16, padding: 20,
    border: "1px solid #2a2a4a", marginBottom: 4,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 16,
    background: "linear-gradient(135deg, #FF6B35, #FF3CAC)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, fontWeight: 800, color: "#fff", flexShrink: 0,
  },
  infoRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "13px 0", borderBottom: "1px solid #1e1e3a",
  },
  dangerBtn: {
    width: "100%", padding: 13,
    background: "rgba(255,107,107,0.1)", color: "#FF6B6B",
    border: "1px solid rgba(255,107,107,0.3)", borderRadius: 12,
    fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 24,
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: 20,
  },
  modal: {
    background: "#1a1a2e", borderRadius: 24, padding: "36px 28px",
    width: "100%", maxWidth: 380, textAlign: "center", border: "1px solid #2a2a4a",
  },
  toast: {
    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
    color: "#fff", padding: "11px 22px", borderRadius: 12,
    fontSize: 14, fontWeight: 600, zIndex: 200,
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
  },
};