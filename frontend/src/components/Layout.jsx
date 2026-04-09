import S from "../styles/index.js";
import Toast from "./Toast.jsx";
import NavBar from "./NavBar.jsx";

export default function Layout({
  user,
  restaurant,
  isAdmin,
  carrito,
  toast,
  tabs,
  activeTab,
  setActiveTab,
  onLogout,
  children,
}) {
  const cantCarrito = carrito.reduce((a, i) => a + i.cantidad, 0);

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
              <span style={S.pointsNum}>{user?.points ?? 0} pts</span>
            </div>
          )}
          {!isAdmin && cantCarrito > 0 && (
            <div style={S.cartBadge}>🛒 {cantCarrito}</div>
          )}
          <button onClick={onLogout} style={S.adminBtn}>
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
