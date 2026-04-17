import { useEffect, useState } from "react";
import { fetchWeatherApi } from "openmeteo";

export default function WeatherInfo({ cidade }) {
  const [clima, setClima] = useState(null);

  const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

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

  function weatherCodeToIcon(code, isDay) {
    if (code >= 61 && code <= 65)
      return "https://img.icons8.com/color/48/rain.png";

    if (code >= 80)
      return "https://img.icons8.com/color/48/storm.png";

    if (code === 0) {
      return isDay
        ? "https://img.icons8.com/color/48/sun--v1.png"
        : "https://img.icons8.com/color/48/moon-symbol.png";
    }

    if (code >= 1 && code <= 3) {
      return isDay
        ? "https://img.icons8.com/color/48/partly-cloudy-day--v1.png"
        : "https://img.icons8.com/color/48/partly-cloudy-night.png";
    }

    return "https://img.icons8.com/color/48/cloud.png";
  }

  useEffect(() => {
    const cityClean = cidade?.split(/[|,/]/)[0].trim();
    if (!cityClean) return;

    const cacheKey = `weather_${cityClean.toLowerCase()}`;

    const loadWeather = async () => {
      try {
        // 🔍 1. Verifica cache
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          const parsed = JSON.parse(cached);

          const isValid = Date.now() - parsed.timestamp < CACHE_TIME;

          if (isValid) {
            setClima(parsed.data);
            return; // usa cache e NÃO chama API
          }
        }

        // 🌐 2. Geocoding
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            cityClean
          )}&count=1&language=pt&format=json`
        ).then((r) => r.json());

        if (!geoRes.results?.length) return;

        const { latitude, longitude } = geoRes.results[0];

        // 🌦️ 3. Clima
        const params = {
          latitude,
          longitude,
          current: [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation",
            "weather_code",
            "is_day",
          ],
          timezone: "America/Sao_Paulo",
        };

        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, params);
        const response = responses[0];

        const current = response.current();
        if (!current) return;

        const temperature = current.variables(0).value();
        const precipitation = current.variables(2).value();
        const weatherCode = current.variables(3).value();
        const isDay = current.variables(4).value();

        const data = {
          temp: Math.round(temperature),
          chuva: precipitation ?? 0,
          desc: weatherCodeToText(weatherCode),
          icon: weatherCodeToIcon(weatherCode, isDay),
        };

        // 💾 4. Salva no cache
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );

        setClima(data);
      } catch (e) {
        console.error("Erro ao buscar clima:", e);
      }
    };

    loadWeather();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cidade]);

  if (!clima)
    return <small style={{ color: "#999", fontSize: "10px" }}>...</small>;

  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: "4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          gap: "4px",
        }}
      >
        <img
          src={clima.icon}
          alt="ícone"
          style={{ width: "32px", height: "32px" }}
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

      <div
        style={{
          fontSize: "9px",
          color: "#444",
          paddingLeft: "2px",
          display: "flex",
          gap: "5px",
        }}
      >
        {clima.chuva > 10 && (
          <span style={{ color: "#0056b3", fontWeight: "bold" }}>
            BT: {clima.chuva}mm
          </span>
        )}
      </div>
    </div>
  );
}