import sqlite3 from "sqlite3";
import { promisify } from "util";
import fs from "fs";

const db = new sqlite3.Database("cycletimeDB.db");
db.run = promisify(db.run);
db.all = promisify(db.all);
db.get = promisify(db.get);
db.close = promisify(db.close);

async function generateReport() {
  try {
    console.log("Gerando relatório de tempo de ciclo por coluna...");

    const rows = await db.all(`
      SELECT 
        list_name, 
        AVG(cycle_time_secs) as avg_seconds
      FROM cards
      GROUP BY list_name
      ORDER BY avg_seconds DESC
    `);

    console.log("\n--- Relatório de Tempo de Ciclo ---");
    
    const reportData = rows.map(row => {
      const seconds = Number(row.avg_seconds);
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      console.log(`
Coluna: "${row.list_name}"
- Segundos: ${seconds.toFixed(2)}s
- Dias: ${days}d ${hours}h ${minutes}m ${secs}s
- Horas: ${(seconds / 3600).toFixed(2)}h
- Minutos: ${(seconds / 60).toFixed(2)}min
----------------------------`);

      return {
        list_name: row.list_name,
        seconds: seconds,
        days: days,
        hours: hours,
        minutes: minutes,
        seconds_remainder: secs
      };
    });

    await fs.promises.writeFile("report.json", JSON.stringify(reportData, null, 2));
    console.log("\nRelatório salvo em report.json");

  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    throw error;
  } finally {
    try {
      await db.close();
      console.log("Conexão com o banco encerrada com sucesso.");
    } catch (err) {
      console.error("Erro ao fechar conexão:", err.message);
    }
  }
}

(async () => {
  try {
    await generateReport();
  } catch (error) {
    console.error("Erro fatal:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();