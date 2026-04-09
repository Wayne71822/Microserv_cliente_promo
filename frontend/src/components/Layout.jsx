import S from "../styles/index.js";
import Toast from "./Toast.jsx";
import NavBar from "./NavBar.jsx";

export default function Layout({
  user,
  restaurant,
  isAdmin,
  cartCount, // Cambiamos 'carrito' por 'cartCount' que ya viene calculado
  toast,
  tabs,
  activeTab,
  setActiveTab,
  handleLogout,
  children,
}) {
  // Eliminamos la línea del .reduce que causaba el error ya que recibimos el número listo
  const mostrarCarrito = cartCount || 0;

  return (
    <div style={S.app}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}>RH</div>
          <div>
            <div style={S.headerTitle}>RestoHub</div>
            <div style={S.headerSub}>{user?.restaurant || restaurant || "Sucursal Principal"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isAdmin && (
            <div style={S.pointsBadge}>
              <span>⭐</span>
              <span style={S.pointsNum}>{user?.points ?? 0} pts</span>
            </div>
          )}
          {!isAdmin && mostrarCarrito > 0 && (
            <div style={S.cartBadge}>🛒 {mostrarCarrito}</div>
          )}
          <button onClick={handleLogout} style={S.adminBtn}>
            Salir
          </button>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.mainInner}>{children}</div>
      </main>

      <NavBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}