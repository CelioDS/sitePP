import { useEffect, useState } from "react";
import { fetchWeatherApi } from "openmeteo";

export default function WeatherInfoFeatures({ cidade, dia }) {
  const [clima, setClima] = useState(null);

  function weatherCodeToText(code) {
    const map = {
      0: "céu limpo",
      1: "parcialmente nublado",
      2: "nublado",
      3: "encoberto",
      45: "neblina",
      48: "neblina densa",
      51: "chuvisco fraco",
      61: "chuva leve",
      63: "chuva moderada",
      65: "chuva forte",
      80: "pancadas fracas",
      95: "tempestade",
    };
    return map[code] || "condição desconhecida";
  }

  function weatherCodeToIcon(code) {
    if (code >= 61 && code <= 65)
      return "https://img.icons8.com/color/48/rain.png";
    if (code >= 80)
      return "https://img.icons8.com/color/48/storm.png";
    if (code === 0)
      return "https://img.icons8.com/color/48/sun--v1.png";
    if (code >= 1 && code <= 3)
      return "https://img.icons8.com/color/48/partly-cloudy-day--v1.png";
    return "https://img.icons8.com/color/48/cloud.png";
  }

  useEffect(() => {
    const cityClean = cidade?.split(/[|,/]/)[0].trim();
    if (!cityClean) return;

    // ✅ Limita o dia: somente D+1 ou D+2
    const diaSeguro = Math.min(Math.max(dia, 1), 2);

    const loadWeather = async () => {
      try {
        /* 1️⃣ Geocoding */
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            cityClean
          )}&count=1&language=pt&format=json`
        ).then((r) => r.json());

        if (!geoRes.results?.length) return;

        const { latitude, longitude } = geoRes.results[0];

        /* 2️⃣ Forecast */
        const params = {
          latitude,
          longitude,
          current: ["temperature_2m", "relative_humidity_2m"],
          daily: [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "weather_code",
          ],
          timezone: "America/Sao_Paulo",
        };

        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, params);
        const response = responses[0];

        const current = response.current();
        const daily = response.daily();
        if (!current || !daily) return;

        /* Atual */
        const tempAtual = current.variables(0).value();
        const umidadeAtual = current.variables(1).value();

        /* Previsão com dia limitado */
        const tempMax = daily.variables(0).valuesArray()[diaSeguro];
        const tempMin = daily.variables(1).valuesArray()[diaSeguro];
        const chuva = daily.variables(2).valuesArray()[diaSeguro];
        const weatherCode = daily.variables(3).valuesArray()[diaSeguro];

        setClima({
          temp: Math.round(tempAtual),
          umidade: Math.round(umidadeAtual),
          chuva,
          desc: `${diaSeguro === 1 ? "Amanhã" : "Depois de amanhã"}: ${Math.round(
            tempMin
          )}° / ${Math.round(tempMax)}° - ${weatherCodeToText(weatherCode)}`,
          icon: weatherCodeToIcon(weatherCode),
        });
      } catch (e) {
        console.error("Erro ao buscar clima:", e);
      }
    };

    loadWeather();
  }, [cidade, dia]);

  if (!clima)
    return <small style={{ color: "#999", fontSize: "10px" }}>...</small>;

  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: "4px" }}>
      <div
        style={{ display: "flex", alignItems: "center", fontSize: "11px", gap: "2px" }}
      >
        <img src={clima.icon} alt="ícone" width={32} />
        <b style={{ color: "#d32f2f" }}>{clima.temp}°C</b>
        <span style={{ fontSize: "9px", color: "#666" }}>
          ({clima.desc})
        </span>
      </div>

      <div style={{ fontSize: "9px", display: "flex", gap: "6px" }}>
        <span>💧 {clima.umidade}%</span>
        {clima.chuva > 10 && (
          <span style={{ color: "#0056b3", fontWeight: "bold" }}>
            🌧 {clima.chuva}mm
          </span>
        )}
      </div>
    </div>
  );
}