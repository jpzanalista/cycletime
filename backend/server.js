import cors from "cors";
import express from "express";
import { openDB } from "./cycletimeDB.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Use o middleware para tratar o JSON e habilitar CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
app.get("/", (req, res) => {
  res.send("API de Tempo de Ciclo está funcionando!");
});

// Endpoint para obter o tempo médio de ciclo por coluna
app.get("/api/cycletime/avg", async (req, res) => {
  const db = openDB(); // Abre a conexão com o banco de dados

  try {
    const sql = `
      SELECT list_name, AVG(cycle_time_secs) as avg_cycle_time
      FROM cards
      GROUP BY list_name
      ORDER BY avg_cycle_time DESC;
    `;
    
    const rows = await db.all(sql);
    res.json(rows); // Retorna os dados em formato JSON

  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar dados de tempo de ciclo." });
  } finally {
    db.close(); // Fecha a conexão com o banco de dados
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});