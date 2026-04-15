import React, { useState, useEffect } from "react";
import WeatherComponent from "../../components/WeatherComponent";
import PlannerComponent from "../PlannerComponent";
import CurrencyComponent from "./CurrencyComponent";
import "../style/style.css";

const Home = () => {
  const [city, setCity] = useState("");
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [editingCity, setEditingCity] = useState(null);
  const [editingGlobalId, setEditingGlobalId] = useState(null);
  const [editGlobalValue, setEditGlobalValue] = useState("");
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/history');
        const data = await res.json();
        if (Array.isArray(data)) setHistory(data);
      } catch (err) {
        console.error("Błąd pobierania historii:", err);
      }
    };
    fetchHistory();
  }, [tripData]);

  const fetchSavedPlans = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/all-saved-plans`);
      const data = await res.json();
      setSavedPlans(data);
    } catch (err) {
      console.error("Błąd pobierania planów:", err);
    }
  };

  useEffect(() => {
    fetchSavedPlans();
  }, []);

  const handleSearch = async (e, historicalCity = null) => {
    if (e) e.preventDefault();
    const searchCity = historicalCity || city;
    if (!searchCity) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/search?city=${searchCity}`);
      if (!response.ok) throw new Error("Nie udało się pobrać danych");
      
      const data = await response.json();
      setTripData(data);
      fetchSavedPlans(); // Odświeżamy plany po zmianie miasta
    } catch (err) {
      setError("Nie znaleziono miasta.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (cityName) => {
    setCity(cityName);
    handleSearch(null, cityName);
  };

const handleSaveAttraction = async (attractionName, targetCity = null) => {
  const cityToSave = targetCity || (tripData ? tripData.city_name : null);

  if (!cityToSave) {
    console.error("Błąd: Nie określono miasta do zapisu!");
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/save-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: cityToSave, // Używamy naszej zmiennej cityToSave
        attraction: attractionName
      })
    });

    if (response.ok) {
      await fetchSavedPlans();
    }
  } catch (err) {
    console.error("Błąd podczas zapisywania:", err);
  }
};

const handleEditAttraction = async (id, newName) => {
  console.log("Próba zapisu edycji dla ID:", id, "Nowa nazwa:", newName);
  
  if (!newName || !newName.trim()) {
    setEditingGlobalId(null);
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/save-plan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attraction: newName })
    });

    if (response.ok) {
      console.log("Zapisano pomyślnie w bazie!");
      await fetchSavedPlans();
    } else {
      console.error("Serwer zwrócił błąd przy edycji");
    }
  } catch (err) {
    console.error("Błąd połączenia z API przy edycji:", err);
  } finally {
    setEditingGlobalId(null);
  }
};


  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/save-plan/${id}`, { method: 'DELETE' });
      fetchSavedPlans();
    } catch (err) {
      console.error("Błąd usuwania:", err);
    }
  };

return (
    <div className="home-container">
      <div className="home-content">
        
        <header className="header-section">
          <h1>CityTrip Explorer</h1>
          <p>Inteligentne planowanie Twoich podróży</p>
        </header>

        <section className="search-box">
          <form onSubmit={handleSearch} className="search-form">
            <input 
              className="search-input"
              placeholder="Wpisz miasto..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button className="search-button">
              {loading ? "..." : "SPRAWDŹ"}
            </button>
          </form>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </section>

        {tripData && (
          <div className="data-grid">
            <div className="data-card">
              <WeatherComponent weatherData={tripData} />
              
              {tripData.currency && (
                <div style={{ marginTop: '20px' }}>
                  <CurrencyComponent currencyData={tripData.currency} />
                </div>
              )}
            </div>
            <div className="data-card">
              <PlannerComponent 
                cityName={tripData.city_name}
                attractions={tripData.top_attractions} 
                attractionsList={tripData.top_attractions_list} 
                onSave={handleSaveAttraction} 
                onDelete={handleDelete} 
                onEdit={handleEditAttraction}
                savedPlans={savedPlans.filter(p => 
                  p.city_name.toLowerCase() === tripData.city_name.toLowerCase()
                )} 
              />
            </div>
          </div>
        )}

        <section className="history-section">
          <h3 className="history-title">Ostatnie wyszukiwania</h3>
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item" onClick={() => handleHistoryClick(item.city_name)}>
                <strong>{item.city_name}</strong> {Math.round(item.temp)}°C
              </div>
            ))}
          </div>
        </section>

        <section className="history-section" style={{ marginTop: '40px', borderTop: '2px solid #1e293b', paddingTop: '30px' }}>
          <h2 style={{ color: '#4facfe', marginBottom: '20px' }}>🗃️ Zarządzaj swoimi listami</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Array.from(new Set(savedPlans.map(p => p.city_name))).map(cityName => (
              <div key={cityName} className="data-card" style={{ borderLeft: '4px solid #4facfe', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #ffffff10', paddingBottom: '10px' }}>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#4facfe' }}>{cityName}</h4>
                  <button 
                    onClick={() => editingCity === cityName ? setEditingCity(null) : setEditingCity(cityName)}
                    style={{ 
                      background: editingCity === cityName ? '#22c55e' : '#334155', 
                      color: 'white', border: 'none', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', transition: 'all 0.2s'
                    }}
                  >
                    {editingCity === cityName ? 'ZAPISZ LISTĘ' : 'EDYTUJ LISTĘ'}
                  </button>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
                  {savedPlans.filter(p => p.city_name === cityName).map(plan => (
                    <li key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #ffffff05' }}>
                      
                      {editingGlobalId === plan.id ? (
                        <input 
                          autoFocus
                          className="search-input" 
                          style={{ fontSize: '0.8rem', padding: '5px', height: 'auto', flex: 1, background: '#0f172a', border: '1px solid #4facfe' }}
                          value={editGlobalValue}
                          onChange={(e) => setEditGlobalValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditAttraction(plan.id, editGlobalValue); 
                            }
                            if (e.key === 'Escape') {
                              setEditingGlobalId(null);
                            }
                          }}
                          onBlur={() => handleEditAttraction(plan.id, editGlobalValue)}
                        />
                      ) : (
                        <span style={{ fontSize: '0.9rem', flex: 1, color: '#e2e8f0' }}>
                          {plan.attraction_name}
                        </span>
                      )}

                      {editingCity === cityName && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => {
                              setEditingGlobalId(plan.id);
                              setEditGlobalValue(plan.attraction_name);
                            }}
                            style={{ background: 'none', border: 'none', color: '#4facfe', cursor: 'pointer', fontSize: '1rem', padding: '2px' }}
                            title="Edytuj nazwę"
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => handleDelete(plan.id)} 
                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px' }}
                            title="Usuń punkt"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: '15px' }}>
                  <input 
                    placeholder={`Dodaj punkt do: ${cityName}...`}
                    className="search-input"
                    style={{ fontSize: '0.75rem', padding: '10px', height: 'auto', width: '100%', background: '#1e293b', border: '1px solid #ffffff10' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleSaveAttraction(e.target.value, cityName); 
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;