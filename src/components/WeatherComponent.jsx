import React, { useEffect, useState } from "react";
import axios from "axios";

const WeatherComponent = ({ location = "Warsaw" }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const API_KEY = process.env.REACT_APP_ACCUWEATHER_API_KEY;

  useEffect(() => {
    const fetchWeather = async () => {
      if (!API_KEY) {
        setError("Brak klucza API!");
        return;
      }

      try {
        const locationResponse = await axios.get(
          `https://dataservice.accuweather.com/locations/v1/cities/search`,
          {
            params: { apikey: API_KEY, q: location },
          }
        );

        console.log("Dane lokalizacji:", locationResponse.data);

        if (!locationResponse.data || locationResponse.data.length === 0) {
          throw new Error("Nie znaleziono lokalizacji.");
        }

        const locationKey = locationResponse.data[0].Key;
        const cityName = locationResponse.data[0].LocalizedName;

        const weatherResponse = await axios.get(
          `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}`,
          {
            params: { apikey: API_KEY },
          }
        );

        console.log("Dane pogodowe:", weatherResponse.data);

        if (!weatherResponse.data || weatherResponse.data.length === 0) {
          throw new Error("Brak danych pogodowych.");
        }

        setWeather({ ...weatherResponse.data[0], cityName });
      } catch (err) {
        console.error("Błąd pobierania danych:", err);
        setError(err.message);
      }
    };

    fetchWeather();
  }, [location]);

  if (error) return <p className="text-red-500">Błąd: {error}</p>;
  if (!weather) return <p>Ładowanie pogody...</p>;


  const iconCode = weather.WeatherIcon || 1;
  const paddedIconCode = iconCode < 10 ? `0${iconCode}` : iconCode;
  const iconUrl = `https://developer.accuweather.com/sites/default/files/${paddedIconCode}-s.png`;
  const cityTranslations = {
    Warsaw: "Warszawa",
    Krakow: "Kraków",
    Wroclaw: "Wrocław",
    Poznan: "Poznań",
  };
  
  const displayCityName = cityTranslations[weather.cityName] || weather.cityName;
  
  const weatherTranslations = {
    Sunny: "Słonecznie",
    Clear: "Bezchmurnie",
    Cloudy: "Pochmurno",
    Rain: "Deszcz",
    Showers: "Przelotne opady",
    Thunderstorms: "Burze",
    Snow: "Śnieg",
    PartlyCloudy: "Częściowe zachmurzenie",
    MostlyCloudy: "Przeważnie pochmurno",
    Fog: "Mgła",
    Windy: "Wietrznie",
    Hazy: "Zamglenie",
  };
  
  const translatedWeatherText = weatherTranslations[weather.WeatherText] || weather.WeatherText;


  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md w-64">
    <h3 className="text-lg font-semibold">Pogoda {displayCityName}</h3>
    <p>{translatedWeatherText}</p>
      <img src={iconUrl} alt="Ikona pogody" />
      <p className="text-xl font-bold">
        {weather.Temperature?.Metric?.Value}°{weather.Temperature?.Metric?.Unit}
      </p>
      {weather.Wind?.Speed?.Metric?.Value && (
        <p>
          Wiatr: {weather.Wind.Speed.Metric.Value} {weather.Wind.Speed.Metric.Unit}
        </p>
      )}
    </div>
  );
};

export default WeatherComponent;
