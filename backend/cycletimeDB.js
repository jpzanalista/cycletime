import sqlite3 from "sqlite3";
import { promisify } from "util";

let dbInstance = null;

export function openDB() {
  if (dbInstance) return dbInstance;

  dbInstance = new sqlite3.Database("cycletimeDB.db", (err) => {
    if (err) {
      console.error("Erro ao conectar ao banco de dados:", err.message);
      throw err;
    }
    console.log("Conexão com o banco de dados estabelecida com sucesso.");
  });

  // Promisify dos métodos
  dbInstance.run = promisify(dbInstance.run);
  dbInstance.all = promisify(dbInstance.all);
  dbInstance.get = promisify(dbInstance.get);
  dbInstance.close = promisify(dbInstance.close);

  // Inicialização do banco
  initializeDB(dbInstance).catch(err => {
    console.error("Erro ao inicializar o banco:", err);
    throw err;
  });

  return dbInstance;
}

async function initializeDB(db) {
  try {
    await db.run(`DROP TABLE IF EXISTS cards_avg;`);
    
    await db.run(`CREATE TABLE IF NOT EXISTS cards (
      card_id TEXT NOT NULL,
      card_name TEXT,
      list_id TEXT NOT NULL,
      list_name TEXT,
      period TEXT,
      cycle_time_secs REAL,
      PRIMARY KEY (card_id, list_id)
    );`);

    await db.run(`CREATE INDEX IF NOT EXISTS idx_list_name ON cards (list_name);`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_period ON cards (period);`);
    
    console.log("Banco de dados inicializado com sucesso");
  } catch (err) {
    console.error("Erro na inicialização do banco:", err);
    throw err;
  }
}

export async function closeDB() {
  if (dbInstance) {
    try {
      await dbInstance.close();
      console.log("Conexão com o banco de dados encerrada com sucesso.");
    } catch (err) {
      console.error("Erro ao fechar o banco de dados:", err.message);
      throw err;
    } finally {
      dbInstance = null;
    }
  }
}

process.on('exit', () => {
  closeDB().catch(() => {});
});