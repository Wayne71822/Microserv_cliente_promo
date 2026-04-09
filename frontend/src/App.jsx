import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { useToast } from "./hooks/useToast.jsx";
import Layout from "./components/Layout.jsx";
import Toast from "./components/Toast.jsx";
import RatingModal from "./components/RatingModal.jsx";

// Páginas cliente
import AuthPage from "./pages/AuthPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import HomePage from "./pages/client/HomePage.jsx";
import MenuPage from "./pages/client/MenuPage.jsx";
import CartPage from "./pages/client/CartPage.jsx";
import PromosPage from "./pages/client/PromosPage.jsx";
import OrdersPage from "./pages/client/OrdersPage.jsx";
import PointsPage from "./pages/client/PointsPage.jsx";
import ProfilePage from "./pages/client/ProfilePage.jsx";

// Páginas admin
import DashboardPage from "./pages/admin/DashboardPage.jsx";
import DishesPage from "./pages/admin/DishesPage.jsx";
import PromosAdminPage from "./pages/admin/PromosAdminPage.jsx";
import RewardsPage from "./pages/admin/RewardsPage.jsx";
import ClientsPage from "./pages/admin/ClientsPage.jsx";
import OrdersAdminPage from "./pages/admin/OrdersAdminPage.jsx";

export default function App() {
  const {
    user,
    handleLogin,
    handleRegister,
    handleLogout,
    handleOnboarding,
    country,
    setCountry,
    restaurant,
    setRestaurant,
  } = useAuth();
  const { toast, showToast } = useToast();
  const [screen, setScreen] = useState("auth");
  const [authTab, setAuthTab] = useState("login");
  const [activeTab, setActiveTab] = useState("home");
  const [ratingModal, setRatingModal] = useState(null);
  const [carrito, setCarrito] = useState([]);

  // ── Carrito ──────────────────────────────────────────────────────────────
  const agregarAlCarrito = (plato) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.plato.id === plato.id);
      if (idx !== -1) {
        const n = [...prev];
        n[idx] = { ...n[idx], cantidad: n[idx].cantidad + 1 };
        return n;
      }
      return [...prev, { plato, cantidad: 1 }];
    });
    showToast(`${plato.emoji} ${plato.nombre} agregado`);
  };

  const quitarDelCarrito = (platoId) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.plato.id === platoId);
      if (idx === -1) return prev;
      const n = [...prev];
      if (n[idx].cantidad > 1)
        n[idx] = { ...n[idx], cantidad: n[idx].cantidad - 1 };
      else n.splice(idx, 1);
      return n;
    });
  };

  const confirmarPedido = (promoAplicada) => {
    const subtotal = carrito.reduce(
      (a, i) => a + i.plato.precio * i.cantidad,
      0,
    );
    const descuento = DB.calcularDescuento(promoAplicada, carrito);
    const totalFinal = subtotal - descuento;
    const pts = Math.floor(totalFinal);
    const orderId = "ORD-" + Date.now();

    const pedido = {
      id: orderId,
      fecha: new Date().toLocaleDateString(),
      items: carrito
        .map(
          (i) =>
            `${i.plato.emoji} ${i.plato.nombre}${i.cantidad > 1 ? ` x${i.cantidad}` : ""}`,
        )
        .join(", "),
      total: totalFinal,
      pts,
      promo: promoAplicada?.nombre || null,
    };

    const tx = {
      id: Date.now(),
      delta: +pts,
      desc: `Puntos por pedido ${orderId}`,
      fecha: new Date().toLocaleDateString(),
    };

    DB.pedidosSede.push({
      id: orderId,
      clienteNombre: user.name,
      fecha: new Date().toLocaleDateString(),
      total: totalFinal,
      items: pedido.items,
      estado: "completado",
    });

    updateUser({
      points: user.points + pts,
      historialPuntos: [...(user.historialPuntos || []), tx],
      pedidos: [...(user.pedidos || []), pedido],
    });

    setCarrito([]);
    setActiveTab("history");
    showToast(`¡Pedido confirmado! +${pts} pts 🎉`);
  };

  // ── Reseña ───────────────────────────────────────────────────────────────
  const handleReseña = (platoId, stars, comentario) => {
    if (DB.yaReseñó(platoId, user.id))
      return showToast("Ya valoraste este plato", "err");
    DB.agregarReseña(platoId, user.id, user.name, stars, comentario);
    const pts = stars * 5;
    const tx = {
      id: Date.now(),
      delta: +pts,
      desc: "Bonus por reseña",
      fecha: new Date().toLocaleDateString(),
    };
    updateUser({
      points: user.points + pts,
      historialPuntos: [...(user.historialPuntos || []), tx],
    });
    showToast(`¡Gracias! +${pts} pts bonus`);
    setRatingModal(null);
  };

  // ── Canje ────────────────────────────────────────────────────────────────
  const handleCanje = (recompensa) => {
    if (!DB.puedesCanjear(user.id, recompensa))
      return showToast("No puedes canjear esta recompensa", "err");
    const codigo =
      recompensa.tipo === "cupon"
        ? "CUPON-" + Math.random().toString(36).substring(2, 8).toUpperCase()
        : null;
    const tx = {
      id: Date.now(),
      delta: -recompensa.puntosReq,
      desc: `Canje: ${recompensa.nombre}`,
      fecha: new Date().toLocaleDateString(),
    };
    const canje = {
      recompensaId: recompensa.id,
      nombre: recompensa.nombre,
      emoji: recompensa.emoji,
      codigo,
      fecha: new Date().toLocaleDateString(),
    };
    updateUser({
      points: user.points - recompensa.puntosReq,
      historialPuntos: [...(user.historialPuntos || []), tx],
      cuponesCanjeados: [...(user.cuponesCanjeados || []), canje],
    });
    showToast(
      codigo ? `¡Código: ${codigo}` : `¡${recompensa.nombre} desbloqueado!`,
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const isAdmin = user?.role === "admin";

  const clienteTabs = [
    { id: "home", icon: "🏠", label: "Inicio" },
    { id: "menu", icon: "🍽️", label: "Menú" },
    {
      id: "carrito",
      icon: `🛒${carrito.length > 0 ? ` (${carrito.reduce((a, i) => a + i.cantidad, 0)})` : ""}`,
      label: "Carrito",
    },
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

  if (screen === "auth")
    return (
      <>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        <AuthPage
          authTab={authTab}
          setAuthTab={setAuthTab}
          onLogin={(email, pass) => {
            const u = handleLogin(email, pass);
            if (!u) return showToast("Email o contraseña incorrectos", "err");
            u.country ? setScreen("home") : setScreen("onboarding");
            showToast(`¡Bienvenido, ${u.name.split(" ")[0]}!`);
          }}
          onRegister={(datos) => {
            const ok = handleRegister(datos);
            if (!ok) return showToast("Este email ya está registrado", "err");
            setScreen("onboarding");
            showToast("¡Cuenta creada!");
          }}
          toast={toast}
          showToast={showToast}
        />
      </>
    );

  if (screen === "onboarding")
    return (
      <OnboardingPage
        user={user}
        country={country}
        setCountry={setCountry}
        restaurant={restaurant}
        setRestaurant={setRestaurant}
        onStart={() => {
          const ok = handleOnboarding();
          if (!ok) return showToast("Selecciona país y restaurante", "err");
          setScreen("home");
          showToast(`¡Bienvenido a ${restaurant}!`);
        }}
        toast={toast}
      />
    );

  return (
    <Layout
      user={user}
      restaurant={restaurant}
      isAdmin={isAdmin}
      carrito={carrito}
      toast={toast}
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => {
        handleLogout();
        setCarrito([]);
        setScreen("auth");
        setAuthTab("login");
        setActiveTab("home");
        showToast("Sesión cerrada");
      }}
    >
      {ratingModal && (
        <RatingModal
          plato={ratingModal}
          onRate={(platoId, stars, comentario) =>
            handleReseña(platoId, stars, comentario)
          }
          onClose={() => setRatingModal(null)}
          customerId={user?.id} // ← agrega esto
        />
      )}

      {/* CLIENTE */}
      {!isAdmin && activeTab === "home" && (
        <HomePage
          user={user}
          showToast={showToast}
          setRatingModal={setRatingModal}
          setActiveTab={setActiveTab}
        />
      )}
      {!isAdmin && activeTab === "menu" && (
        <MenuPage
          user={user}
          onAgregar={agregarAlCarrito}
          setRatingModal={setRatingModal}
        />
      )}
      {!isAdmin && activeTab === "carrito" && (
        <CartPage
          carrito={carrito}
          onAgregar={agregarAlCarrito}
          onQuitar={quitarDelCarrito}
          onConfirmar={confirmarPedido}
        />
      )}
      {!isAdmin && activeTab === "promos" && <PromosPage carrito={carrito} />}
      {!isAdmin && activeTab === "history" && <OrdersPage user={user} />}
      {!isAdmin && activeTab === "points" && (
        <PointsPage user={user} onCanje={handleCanje} />
      )}

      {/* ADMIN */}
      {isAdmin && activeTab === "dashboard" && <DashboardPage user={user} />}
      {isAdmin && activeTab === "platos" && (
        <DishesPage showToast={showToast} />
      )}
      {isAdmin && activeTab === "promos" && (
        <PromosAdminPage showToast={showToast} />
      )}
      {isAdmin && activeTab === "recompensas" && (
        <RewardsPage showToast={showToast} />
      )}
      {isAdmin && activeTab === "clientes" && <ClientsPage user={user} />}
      {isAdmin && activeTab === "pedidos" && <OrdersAdminPage />}

      {/* COMPARTIDO */}
      {activeTab === "profile" && (
        <ProfilePage
          user={user}
          onLogout={handleLogout}
          updateUser={() => {}}
          showToast={showToast}
          isAdmin={isAdmin}
        />
      )}
    </Layout>
  );
}
