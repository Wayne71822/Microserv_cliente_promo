import S from "../styles/index.js";

export default function OnboardingPage({
  user,
  country,
  setCountry,
  restaurant,
  setRestaurant,
  onStart,
  toast,
}) {
  // ─── ONBOARDING ───────────────────────────────────────────────────────────────
  function OnboardingScreen({
    user,
    country,
    setCountry,
    restaurant,
    setRestaurant,
    onStart,
    toast,
  }) {
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
          <select
            style={S.select}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setRestaurant("");
            }}
          >
            <option value="">Selecciona tu país...</option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {country && (
            <>
              <label style={S.label}>Restaurante</label>
              <select
                style={S.select}
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
              >
                <option value="">Selecciona restaurante...</option>
                {RESTAURANTS[country]?.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </>
          )}
          <button
            style={{
              ...S.primaryBtn,
              opacity: !country || !restaurant ? 0.4 : 1,
            }}
            onClick={onStart}
          >
            Entrar →
          </button>
        </div>
      </div>
    );
  }
}
