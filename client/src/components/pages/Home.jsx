import React, { useState, useEffect } from "react";
import WeatherComponent from "./WeatherComponent";
import PlannerComponent from "./PlannerComponent";
import CurrencyComponent from "./CurrencyComponent";
import MapComponent from "./MapComponent";
import "../style/style.css";
import { Search, MapPin, Trash2, Edit3 } from 'lucide-react';

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
    if (e && e.preventDefault) e.preventDefault();
    const searchCity = historicalCity || city;
    if (!searchCity) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/search?city=${searchCity}`);
      
      if (!response.ok) throw new Error("Nie udało się pobrać danych");
      
      const data = await response.json();
      setTripData(data);
      setCity(searchCity);
    } catch (err) {
      setError("Nie znaleziono miasta.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (selectedCity) => {
    setCity(selectedCity); 
    handleSearch(null, selectedCity);
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
          city: cityToSave,
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
        await fetchSavedPlans();
      }
    } catch (err) {
      console.error("Błąd edycji:", err);
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
          <h1 className="main-title">CityTrip Explorer</h1>
        </header>

        <section className="search-box">
          <form onSubmit={handleSearch} className="search-form">
            <input 
              className="search-input"
              placeholder="Gdzie chcesz lecieć? (np. Paryż, Tokyo...)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button type="submit" className="search-button">
              {loading ? "..." : "SPRAWDŹ"}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', marginTop: '15px' }}>{error}</p>}
        </section>

        <section className="history-section">
          <h3 className="history-title" style={{marginBottom: '15px', color: '#bfd3ff'}}>OSTATNIO SZUKANE</h3>
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item" onClick={() => handleHistoryClick(item.city_name)}>
                <span style={{color: '#bfd3ff'}}></span> <strong>{item.city_name}</strong> 
                <span style={{marginLeft: '10px', opacity: 0.8}}>{Math.round(item.temp)}°C</span>
              </div>
            ))}
          </div>
        </section>

        {tripData && (
          <>
            <div className="data-grid">
              <div className="data-card">
                <h3 style={{color: '#bfd3ff', marginBottom: '20px'}}>Informacje</h3>
                <WeatherComponent weatherData={tripData} />
                
                <div style={{ margin: '25px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                
                {tripData.currency && (
                  <div>
                    <CurrencyComponent currencyData={tripData.currency} />
                  </div>
                )}
              </div>

              <div className="data-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                   <h3 style={{color: '#bfd3ff', margin: 0}}>Plan podróży: {tripData.city_name}</h3>
                </div>
                <PlannerComponent 
                  cityName={tripData.city_name}
                  attractions={tripData.top_attractions} 
                  attractionsList={tripData.top_attractions_list.map(a => a.title)} 
                  onSave={handleSaveAttraction} 
                  onDelete={handleDelete} 
                  onEdit={handleEditAttraction}
                  savedPlans={savedPlans.filter(p => 
                    p.city_name.toLowerCase() === tripData.city_name.toLowerCase()
                  )} 
                />
              </div>
            </div>

            <div className="data-card map-section">
              <h3 style={{ color: '#bfd3ff', marginBottom: '20px' }}>Interaktywna mapa punktów</h3>
              <div style={{ borderRadius: '16px', overflow: 'hidden', height: '500px' }}>
                <MapComponent 
                  cityCoords={{ lat: tripData.lat, lon: tripData.lon }} 
                  attractions={tripData.top_attractions_list} 
                />
              </div>
            </div>
          </>
        )}

        <section style={{ marginTop: '50px' }}>
  <h2 style={{ color: '#f1f5f9', marginBottom: '30px', fontSize: '2rem', fontWeight: '800' }}>
    Twoje kolekcje
  </h2>
  <div className="saved-lists-grid">
    {Array.from(new Set(savedPlans.map(p => p.city_name))).map(cityName => (
      <div key={cityName} className="saved-card">
        {/* Nagłówek Karty */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#bfd3ff', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {cityName}
          </h4>
          <button 
            onClick={() => editingCity === cityName ? setEditingCity(null) : setEditingCity(cityName)}
            className="save-btn" 
            style={{
              padding: '8px 15px', 
              cursor: 'pointer', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold',
              background: editingCity === cityName ? '#10b981' : '#334155',
              color: 'white',
              transition: 'all 0.2s'
            }}
          >
            {editingCity === cityName ? 'GOTOWE ✅' : 'EDYTUJ'}
          </button>
        </div>
        
        {/* Lista Punktów */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
          {savedPlans.filter(p => p.city_name === cityName).map(plan => (
            <li 
              key={plan.id} 
              style={{ 
                padding: '12px 0', 
                borderBottom: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>{plan.attraction_name}</span>
              
              {/* Przycisk usuwania widoczny tylko w trybie edycji */}
              {editingCity === cityName && (
                <button 
                  onClick={() => handleDelete(plan.id)} 
                  className="action-btn delete"
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: 'none', 
                    color: '#ef4444', 
                    padding: '6px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  title="Usuń punkt"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Formularz dodawania widoczny tylko w trybie edycji */}
        {editingCity === cityName && (
          <div className="planner-input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
            <input 
              placeholder="Dodaj punkt..."
              className="search-input"
              style={{ padding: '10px 15px', fontSize: '0.9rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  handleSaveAttraction(e.target.value, cityName); 
                  e.target.value = '';
                }
              }}
            />
            <button 
              className="add-button-wide" 
              style={{ padding: '0 20px', minHeight: '42px' }}
              onClick={(e) => {
                const input = e.target.closest('.planner-input-group').querySelector('input');
                if(input.value.trim()) {
                  handleSaveAttraction(input.value, cityName);
                  input.value = '';
                }
              }}
            >
              DODAJ
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
</section>
      </div>
    </div>
  );
};

export default Home;