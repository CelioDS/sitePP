import { useEffect, useState } from "react";
import axios from "axios";

export default function Cotas({ Url }) {
  const [database, setDatabase] = useState([]);

  useEffect(() => {
    async function fetchDatabase() {
      try {
        const res = await axios.get(`${Url}/cotas`);
        setDatabase(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchDatabase();
  }, [Url]);

  return (
    <main>
      <h1>oi</h1>

      
    </main>
  );
}