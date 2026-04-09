import { useState } from "react";
import S from "./styles/index.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useToast } from "./hooks/useToast.jsx";
import Layout from "./components/Layout.jsx";
import Toast from "./components/Toast.jsx";
import RatingModal from "./components/RatingModal.jsx";

// Páginas cliente
import MenuPage from "./pages/client/MenuPage.jsx";
import CartPage from "./pages/client/CartPage.jsx";
import OrdersPage from "./pages/client/OrdersPage.jsx";
import PointsPage from "./pages/client/PointsPage.jsx";
import ProfilePage from "./pages/client/ProfilePage.jsx";

// Páginas admin
import DishesPage from "./pages/admin/DishesPage.jsx";

export default function App() {
  const { user, isAuthenticated, isLoading, handleLogin, handleLogout } = useAuth();
  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState("menu");
  const [carrito, setCarrito] = useState([]);
  const [ratingModal, setRatingModal] = useState(null);

  if (isLoading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Cargando...</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%", color: "white" }}>
        <h1>RestoApp Microservicios</h1>
        <button style={{ padding: '10px 20px', cursor: 'pointer' }} onClick={handleLogin}>
          Iniciar Sesión con Auth0
        </button>
      </div>
    );
  }

  // Lógica de Carrito
  const agregarAlCarrito = (plato) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.plato.id === plato.id);
      if (existe) return prev.map((i) => i.plato.id === plato.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { plato, cantidad: 1 }];
    });
    showToast(`Agregado: ${plato.name || plato.nombre}`);
  };

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.map((i) => i.plato.id === id ? { ...i, cantidad: i.cantidad - 1 } : i).filter((i) => i.cantidad > 0));
  };

  // El "Admin" se define por el email configurado en Auth0 (o por roles si los configuraste)
  const isAdmin = user?.email === "elvergalarga072599@gmail.com";

  return (
    <Layout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isAdmin={isAdmin}
      handleLogout={handleLogout}
      cartCount={carrito.reduce((a, b) => a + b.cantidad, 0)}
    >
      {/* Vistas de Cliente */}
      {!isAdmin && activeTab === "menu" && (
        <MenuPage user={user} onAgregar={agregarAlCarrito} setRatingModal={setRatingModal} />
      )}
      {!isAdmin && activeTab === "carrito" && (
        <CartPage user={user} carrito={carrito} onAgregar={agregarAlCarrito} onQuitar={quitarDelCarrito} />
      )}
      {!isAdmin && activeTab === "history" && <OrdersPage user={user} />}
      {!isAdmin && activeTab === "points" && <PointsPage user={user} />}

      {/* Vistas de Admin */}
      {isAdmin && activeTab === "platos" && <DishesPage showToast={showToast} />}

      {activeTab === "profile" && <ProfilePage user={user} />}

      {toast && <Toast message={toast.msg} type={toast.type} />}

      {ratingModal && (
        <RatingModal
          plato={ratingModal}
          customerId={user?.sub} // Auth0 ID
          onClose={() => setRatingModal(null)}
          onRate={() => {
            showToast("¡Gracias por tu calificación!");
            setRatingModal(null);
          }}
        />
      )}
    </Layout>
  );
}