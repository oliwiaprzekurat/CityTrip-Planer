const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log("✅ Połączono z PostgreSQL (projekt_db)!"))
  .catch(err => console.error("❌ Błąd bazy:", err));

app.get('/api/search', async (req, res) => {
  const city = req.query.city;
  const API_KEY = "5e95dbc79fea865d1535c873d3b4dc61";

  if (!city) return res.status(400).json({ error: "Brak nazwy miasta" });

  try {
    // 1. Pobieranie pogody
    const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pl`);
    const officialName = weatherRes.data.name;
    const countryCode = weatherRes.data.sys.country;

    // 2. Waluty (zostaje bez zmian)
    const currencyMap = { 'PL': 'PLN', 'DE': 'EUR', 'IT': 'EUR', 'FR': 'EUR', 'ES': 'EUR', 'US': 'USD', 'GB': 'GBP' };
    const currencyCode = currencyMap[countryCode] || 'EUR';
    let currencyData = { code: currencyCode, mid_rate: 4.30 };
    
    if (currencyCode === 'PLN') {
      currencyData = { code: 'PLN', mid_rate: 1 };
    } else {
      try {
        const nbpRes = await axios.get(`http://api.nbp.pl/api/exchangerates/rates/a/${currencyCode}/?format=json`);
        currencyData = { code: currencyCode, mid_rate: nbpRes.data.rates[0].mid };
      } catch (e) { console.log("NBP Error"); }
    }

    // 3. Prognoza (zostaje bez zmian)
    const forecastRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=pl`);
    const forecastData = forecastRes.data.list.filter((_, i) => i % 8 === 0).slice(0, 5).map(item => ({
      day: new Date(item.dt * 1000).toLocaleDateString('pl-PL', { weekday: 'short' }),
      temp: Math.round(item.main.temp),
      desc: item.weather[0].description
    }));

// 4. Pobieranie opisu z Wikipedii - Wersja Inteligentna
    let wikiDescription = "Brak dostępnego opisu.";
    
    // Próbujemy różnych kombinacji, aby uniknąć stron ujednoznaczniających
    const titlesToTry = [
      `${officialName}_(miasto)`, // Piła (miasto)
      officialName,                // Piła
      `${officialName}_(województwo_wielkopolskie)` // Opcja zapasowa
    ];

    for (const title of titlesToTry) {
      try {
        const wikiUrl = `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
        const resWiki = await axios.get(wikiUrl, {
          headers: { 'User-Agent': 'CityTripPlanner/1.0 (kontakt@twojedomena.pl)' }
        });

        const extract = resWiki.data.extract;

        // Sprawdzamy, czy opis nie jest stroną ujednoznaczniającą lub definicją geometryczną
        if (
          extract && 
          !extract.includes("płaszczyzny") && 
          !extract.includes("może odnosić się do") &&
          !extract.includes("strona ujednoznaczniająca")
        ) {
          wikiDescription = extract;
          break; // Znaleźliśmy poprawny opis, wychodzimy z pętli for
        }
      } catch (err) {
        // Jeśli dany tytuł nie istnieje (404), idziemy do kolejnego z listy
        continue;
      }
    }

    // 5. Pobieranie atrakcji przez GeoSearch (z koordynatami)
    let attractionsList = [];
    const lat = weatherRes.data.coord.lat;
    const lon = weatherRes.data.coord.lon;

    try {
      const wikiGeoUrl = `https://pl.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=40&format=json&origin=*`;
      
      const geoRes = await axios.get(wikiGeoUrl, { 
        headers: { 'User-Agent': 'CityTripPlanner/1.0' } 
      });

      if (geoRes.data?.query?.geosearch) {
        attractionsList = geoRes.data.query.geosearch
          .filter(item => {
            const t = item.title.toLowerCase();
            const isForbidden = [
              "gmina", "powiat", "województwo", "urząd", "dekanat", "herb", 
              "wydział", "uniwersytet", "collegium", "szkoła", "liceum", "zespół szkół",
              "bank", "sąd", "prokuratura", "komenda", "stacja", "szpital",
              "zakład", "centrum edukacji", "parafia", "konsulat", "budynek",
              "prowincja", "metropolia", "archidiecezja", "diecezja", "powstanie", 
              "bitwa", "wojna", "historia", "demografia", "geografia", "lista"
            ].some(word => t.includes(word));

            return t !== officialName.toLowerCase() && !isForbidden;
          })
          .map(item => ({
            title: item.title,
            lat: item.lat, // Przekazujemy szerokość
            lon: item.lon  // Przekazujemy długość
          }))
          .slice(0, 10);
      }
    } catch (e) {
      console.log("Wiki Geo Error:", e.message);
    }

    // 6. Składanie finalnej odpowiedzi (dodajemy lat/lon miasta)
    const responseData = {
      city_name: officialName,
      lat: lat, // Potrzebne do wycentrowania mapy
      lon: lon, // Potrzebne do wycentrowania mapy
      weather_info: {
        temp: weatherRes.data.main.temp,
        condition: weatherRes.data.weather[0].description,
        icon: weatherRes.data.weather[0].icon
      },
      forecast: forecastData,
      top_attractions: wikiDescription,
      top_attractions_list: attractionsList, 
      currency: currencyData
    };

    // Zapis do bazy danych
    await pool.query(
      `INSERT INTO trips (city_name, temp, description) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (city_name) 
       DO UPDATE SET temp = EXCLUDED.temp, description = EXCLUDED.description, date = NOW()`,
      [officialName, responseData.weather_info.temp, responseData.weather_info.condition]
    );

    res.json(responseData);

  } catch (error) {
    console.error("Błąd serwera:", error.message);
    res.status(500).json({ error: "Nie znaleziono miasta lub błąd API" });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trips ORDER BY date DESC LIMIT 5');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Błąd bazy" });
  }
});

app.post('/api/save-plan', async (req, res) => {
  const { city, attraction } = req.body;
  if (!city || !attraction) return res.status(400).json({ error: "Brak danych" });

  try {
    const result = await pool.query(
      'INSERT INTO saved_plans (city_name, attraction_name) VALUES ($1, $2) RETURNING *',
      [city, attraction]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Błąd zapisu planu:", err);
    res.status(500).json({ error: "Błąd bazy danych" });
  }
});

app.get('/api/all-saved-plans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saved_plans ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("Błąd pobierania planów:", err);
    res.status(500).json({ error: "Błąd bazy danych" });
  }
});

app.delete('/api/save-plan/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM saved_plans WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Nie znaleziono punktu" });
    res.json({ message: "Usunięto pomyślnie" });
  } catch (err) {
    console.error("Błąd usuwania punktu:", err);
    res.status(500).json({ error: "Błąd bazy danych" });
  }
});

app.put('/api/save-plan/:id', async (req, res) => {
  const { id } = req.params;
  const { attraction } = req.body;

  if (!attraction) {
    return res.status(400).json({ error: "Nowa nazwa atrakcji jest wymagana" });
  }

  try {
    const result = await pool.query(
      'UPDATE saved_plans SET attraction_name = $1 WHERE id = $2 RETURNING *',
      [attraction, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Nie znaleziono punktu o podanym ID" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Błąd podczas aktualizacji punktu:", err);
    res.status(500).json({ error: "Błąd bazy danych" });
  }
});
app.listen(5000, () => console.log("🚀 Serwer działa na porcie 5000"));

// Przykład zapytania do OpenStreetMap (Overpass API)
const fetchAttractionsFromOSM = async (cityName) => {
  const query = `
    [out:json];
    area[name="${cityName}"]->.searchArea;
    (
      node["tourism"="attraction"](area.searchArea);
      node["historic"](area.searchArea);
    );
    out body 10;`;
  
  const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  const data = await response.json();
  
  // Zwracamy tylko unikalne nazwy
  return data.elements
    .map(el => el.tags.name)
    .filter(name => name != null);
};