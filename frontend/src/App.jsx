import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Layout from "./components/Layout";

// --- IMPORTS ADMIN ---
import AdminDashboard from "./pages/admin/DashboardPage";
import DishesPage from "./pages/admin/DishesPage";
import PromosAdminPage from "./pages/admin/PromosAdminPage";
import AdminPedidos from "./pages/admin/OrdersAdminPage";
import RewardsPage from "./pages/admin/RewardsPage";
import AdminClientes from "./pages/admin/ClientsPage";

// --- IMPORTS CLIENTE ---
import HomePage from "./pages/client/HomePage";
import MenuTab from "./pages/client/MenuPage";
import CarritoTab from "./pages/client/CartPage";
import HistoryTab from "./pages/client/OrdersPage";
import PromosPage from "./pages/client/PromosPage";
import PointsPage from "./pages/client/PointsPage";
import ProfileTab from "./pages/client/ProfilePage";

function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();

  // Estados de navegación y funcionalidad
  const [activeTab, setActiveTab] = useState("dashboard");
  const [carrito, setCarrito] = useState([]);
  const [ratingModal, setRatingModal] = useState(null);

  if (isLoading) return <div className="loading">Cargando aplicación...</div>;

  const isAdmin = user?.email === "elvergalarga072599@gmail.com";

  // Sincronizar tab inicial si no es admin
  if (isAdmin && activeTab === "home") setActiveTab("dashboard");
  if (!isAdmin && activeTab === "dashboard") setActiveTab("home");

  // --- LÓGICA DE CARRITO ---
  const onAgregar = (plato) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.plato.id === plato.id);
      if (existe) return prev.map(i => i.plato.id === plato.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { plato, cantidad: 1 }];
    });
  };

  const onQuitar = (platoId) => {
    setCarrito(prev => prev.reduce((acc, i) => {
      if (i.plato.id === platoId) {
        if (i.cantidad > 1) acc.push({ ...i, cantidad: i.cantidad - 1 });
      } else acc.push(i);
      return acc;
    }, []));
  };

  const onConfirmarPedido = () => {
    alert("Pedido enviado correctamente");
    setCarrito([]);
    setActiveTab("history");
  };

  // --- CONFIGURACIÓN DE PESTAÑAS ---
  const tabs = isAdmin
    ? [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "platos", label: "Platos", icon: "🍴" },
      { id: "promos_admin", label: "Promos", icon: "🏷️" },
      { id: "pedidos_admin", label: "Pedidos", icon: "📦" },
      { id: "puntos_admin", label: "Premios", icon: "🎁" },
      { id: "clientes", label: "Clientes", icon: "👥" },
      { id: "profile", label: "Perfil", icon: "👤" }
    ]
    : [
      { id: "home", label: "Inicio", icon: "🏠" },
      { id: "menu", label: "Menú", icon: "📖" },
      { id: "carrito", label: "Carrito", icon: `🛒${carrito.length > 0 ? ` (${carrito.length})` : ""}` },
      { id: "promos", label: "Promos", icon: "🏷️" },
      { id: "history", label: "Mis Pedidos", icon: "📋" },
      { id: "points", label: "Mis Puntos", icon: "⭐" },
      { id: "profile", label: "Perfil", icon: "👤" }
    ];

  const showToast = (msg) => console.log("Toast:", msg);

  return (
    <Layout
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
    >
      {/* VISTAS ADMINISTRADOR */}
      {isAdmin && (
        <>
          {activeTab === "dashboard" && <AdminDashboard user={user} />}
          {activeTab === "platos" && <DishesPage showToast={showToast} />}
          {activeTab === "promos_admin" && <PromosAdminPage user={user} showToast={showToast} />}
          {activeTab === "pedidos_admin" && <AdminPedidos />}
          {activeTab === "puntos_admin" && <RewardsPage user={user} showToast={showToast} />}
          {activeTab === "clientes" && <AdminClientes user={user} />}
        </>
      )}

      {/* VISTAS CLIENTE */}
      {!isAdmin && (
        <>
          {activeTab === "home" && (
            <HomePage
              user={user}
              setActiveTab={setActiveTab}
              setRatingModal={setRatingModal}
            />
          )}
          {activeTab === "menu" && (
            <MenuTab
              user={user}
              onAgregar={onAgregar}
              setRatingModal={setRatingModal}
            />
          )}
          {activeTab === "carrito" && (
            <CarritoTab
              user={user}
              carrito={carrito}
              onAgregar={onAgregar}
              onQuitar={onQuitar}
              onConfirmar={onConfirmarPedido}
            />
          )}
          {activeTab === "promos" && <PromosPage user={user} carrito={carrito} />}
          {activeTab === "history" && <HistoryTab user={user} />}
          {activeTab === "points" && <PointsPage user={user} />}
        </>
      )}

      {/* VISTA COMÚN */}
      {activeTab === "profile" && (
        <ProfileTab
          user={user}
          isAdmin={isAdmin}
          onLogout={() => logout({ returnTo: window.location.origin })}
          showToast={showToast}
        />
      )}

      {/* MODAL DE VALORACIÓN (Global) */}
      {ratingModal && (
        <div className="modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Valorar {ratingModal.name || ratingModal.nombre}</h3>
            <p>Aquí puedes implementar el formulario de estrellas...</p>
            <button onClick={() => setRatingModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;