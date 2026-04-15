import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cloud, Sun, CloudRain, Thermometer, Wind as AirIcon } from "lucide-react";
import './style/style.css';

const getWeatherIcon = (desc) => {
  const d = desc ? desc.toLowerCase() : "";
  if (d.includes("deszcz")) return <CloudRain size={20} className="text-blue-500" />;
  if (d.includes("słońce") || d.includes("jasno") || d.includes("pogodnie")) return <Sun size={20} className="text-yellow-500" />;
  return <Cloud size={20} className="text-gray-400" />;
};

const WeatherComponent = ({ weatherData }) => {
  // Sprawdzamy czy dane dopłynęły
  if (!weatherData || !weatherData.weather_info) return null;

  const { city_name, weather_info, forecast } = weatherData;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      
     <div className="p-6 bg-[#1e293b] rounded-3xl shadow-2xl border border-white/10 hover:border-blue-500/50 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight">{city_name}</h3>
          <p className="text-blue-400 font-medium capitalize">{weather_info.condition}</p>
        </div>
        <img 
          src={`https://openweathermap.org/img/wn/${weather_info.icon}@4x.png`} 
          alt="pogoda" 
          className="w-20 h-20 -mt-2 filter drop-shadow-lg"
        />
      </div>

      <div className="flex items-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <Thermometer size={32} className="text-blue-400" />
          <span className="text-5xl font-bold text-white">{Math.round(weather_info.temp)}°C</span>
        </div>
        <div className="text-gray-400 text-sm border-l border-gray-700 pl-4">
          <p>Jakość powietrza</p>
          <p className="text-blue-300 font-bold">{weather_info.air_quality || 'Dobra'}</p>
        </div>
      </div>
    </div>

      {/* PROGNOZA 5 DNI */}
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
          <Sun size={16} /> Prognoza 5-dniowa
        </h4>
        
        <div className="flex justify-between mb-6">
          {forecast && forecast.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-500">{day.day}</span>
              {/* TUTAJ WYWOŁUJEMY FUNKCJĘ */}
              {getWeatherIcon(day.desc)}
              <span className="text-sm font-bold text-gray-800">{day.temp}°C</span>
            </div>
          ))}
        </div>

        {/* WYKRES RECHARTS */}
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast}>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ display: 'none' }}
              />
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WeatherComponent;