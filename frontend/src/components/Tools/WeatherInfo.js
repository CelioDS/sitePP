import { useEffect, useState } from "react";
import axios from "axios";

export default function WeatherInfo({ cidade, apiKey }) {
  const [clima, setClima] = useState(null);

  useEffect(() => {
    const cityClean = cidade.split(/[|,/]/)[0].trim();

    if (!cityClean || !apiKey) return;

    const fetchWeather = async () => {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityClean}&units=metric&appid=${apiKey}&lang=pt_br`;
        const res = await axios.get(url);
        console.log(res);

        setClima({
          temp: Math.round(res.data.main.temp),
          icon: res.data.weather[0].icon,
          desc: res.data.weather[0].description,
          // Pega volume de chuva na última 1h (se existir)
          chuva: res.data.rain ? res.data.rain["1h"] || res.data.rain["3h"] : 0,
          umidade: res.data.main.humidity, // Umidade ajuda a prever o "clima" de chuva
        });
      } catch (error) {
        console.error(`Erro clima: ${cityClean}`);
      }
    };

    fetchWeather();
  }, [cidade, apiKey]);

  if (!clima)
    return <small style={{ color: "#999", fontSize: "10px" }}>...</small>;

  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: "4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          gap: "2px",
        }}
      >
        <img
          src={`https://openweathermap.org/img/wn/${clima.icon}.png`}
          alt="ícone"
          style={{
            width: "32px",
            height: "32px",
            textAlign: "center",
            display: "block",
          }}
        />
        <span style={{ fontWeight: "bold", color: "#d32f2f" }}>
          {clima.temp}°C
        </span>
        <span
          style={{
            color: "#666",
            fontSize: "9px",
            textTransform: "capitalize",
          }}
        >
          ({clima.desc})
        </span>
      </div>

      {/* Exibição de Umidade e Chuva (mm) */}
      <div
        style={{
          fontSize: "9px",
          color: "#444",
          paddingLeft: "2px",
          display: "flex",
          gap: "5px",
        }}
      >
        <span>💧 {clima.umidade}%</span>
        {clima.chuva > 10 && (
          <span style={{ color: "#0056b3", fontWeight: "bold" }}>
            BT: {clima.chuva}mm
          </span>
        )}
      </div>
    </div>
  );
}
