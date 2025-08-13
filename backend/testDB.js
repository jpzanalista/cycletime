import { openDB, closeDB } from './cycletimeDB.js';

async function test() {
  let db;
  try {
    db = openDB();
    
    // Teste de consulta
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tabelas existentes:", tables);
    
    // Teste de inserção
    await db.run(`
      INSERT OR IGNORE INTO cards 
      (card_id, card_name, list_id, list_name, period, cycle_time_secs)
      VALUES (?, ?, ?, ?, ?, ?)`, 
      ['test1', 'Test Card', 'list1', 'Backlog', '2023-01-01', 3600]
    );
    
    // Verificação
    const cards = await db.all("SELECT * FROM cards");
    console.log("Cartões:", cards);
    
  } catch (err) {
    console.error("Erro durante os testes:", err);
  } finally {
    if (db) {
      await closeDB();
    }
  }
}

test();