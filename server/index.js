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
    // 1. Pobieranie pogody i KODU KRAJU
    const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pl`);
    const officialName = weatherRes.data.name;
    const countryCode = weatherRes.data.sys.country; // Pobieramy np. "IT", "PL", "CZ"

    // 2. LOGIKA WALUT
    const currencyMap = {
      'PL': 'PLN',
      'DE': 'EUR', 'IT': 'EUR', 'FR': 'EUR', 'ES': 'EUR', 'AT': 'EUR', 'BE': 'EUR', 'NL': 'EUR', 'GR': 'EUR', 'HR': 'EUR',
      'US': 'USD', 'GB': 'GBP', 'CZ': 'CZK', 'CH': 'CHF', 'HU': 'HUF'
    };

    const currencyCode = currencyMap[countryCode] || 'EUR'; // Domyślnie EUR dla reszty Europy
    let currencyData = null;

    if (currencyCode === 'PLN') {
      currencyData = { code: 'PLN', mid_rate: 1 };
    } else {
      try {
        // Pobieramy kurs z NBP
        const nbpRes = await axios.get(`http://api.nbp.pl/api/exchangerates/rates/a/${currencyCode}/?format=json`);
        currencyData = {
          code: currencyCode,
          mid_rate: nbpRes.data.rates[0].mid
        };
      } catch (nbpErr) {
        console.log("Błąd NBP, używam kursu awaryjnego");
        currencyData = { code: currencyCode, mid_rate: 4.30 }; // Kurs "na sztywno" w razie awarii API
      }
    }

    // 3. Pobieranie prognozy
    const forecastRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=pl`);
    const forecastData = forecastRes.data.list
      .filter((item, index) => index % 8 === 0)
      .map(item => ({
        day: new Date(item.dt * 1000).toLocaleDateString('pl-PL', { weekday: 'short' }),
        temp: Math.round(item.main.temp),
        desc: item.weather[0].description
      })).slice(0, 5);

    // 4. Pobieranie opisu z Wikipedii
    let wikiDescription = "Brak dostępnego opisu.";
    const titlesToTry = [`${officialName}_(miasto)`, officialName];

    for (const title of titlesToTry) {
      try {
        const wikiUrl = `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const resWiki = await axios.get(wikiUrl, { headers: { 'User-Agent': 'CityTripPlanner/1.0' } });
        const extract = resWiki.data.extract;
        if (extract && !extract.includes("płaszczyzny")) {
          wikiDescription = extract;
          break;
        }
      } catch (err) { continue; }
    }

    // 5. Pobieranie listy atrakcji
    let attractionsList = [];
    try {
      const wikiSearchUrl = `https://pl.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent('Atrakcje ' + officialName)}&limit=10&format=json&origin=*`;
      const searchRes = await axios.get(wikiSearchUrl, { headers: { 'User-Agent': 'CityTripPlanner/1.0' } });
      if (searchRes.data && searchRes.data[1]) {
        attractionsList = searchRes.data[1].slice(1, 6);
      }
    } catch (e) { console.log("Błąd atrakcji"); }

    // 6. Składanie finalnej odpowiedzi
    const responseData = {
      city_name: officialName,
      weather_info: {
        temp: weatherRes.data.main.temp,
        condition: weatherRes.data.weather[0].description,
        icon: weatherRes.data.weather[0].icon
      },
      forecast: forecastData,
      top_attractions: wikiDescription,
      top_attractions_list: attractionsList,
      currency: currencyData // <--- TO PRZESYŁAMY DO REACTA
    };

    // Zapis do historii (PostgreSQL)
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
    res.status(404).json({ error: "Błąd podczas pobierania danych!" });
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