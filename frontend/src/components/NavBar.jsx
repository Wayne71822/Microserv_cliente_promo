import S from "../styles/index.js";

export default function NavBar({ tabs, activeTab, setActiveTab }) {
  <nav style={S.nav}>
    <div style={S.navInner}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          style={{
            ...S.navBtn,
            ...(activeTab === tab.id ? S.navBtnActive : {}),
          }}
          onClick={() => setActiveTab(tab.id)}
        >
          <span style={S.navIcon}>{tab.icon}</span>
          <span style={S.navLabel}>{tab.label}</span>
        </button>
      ))}
    </div>
  </nav>;
}
