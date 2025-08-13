import "dotenv/config";
import axios from "axios";
import { openDB } from "./cycletimeDB.js";

const apiKey = process.env.apiKey_DB;
const apiToken = process.env.apiToken_DB;
const idBoard = process.env.idBoard_DB;

const trelloApi = axios.create({
  baseURL: "https://api.trello.com/1",
  params: {
    key: apiKey,
    token: apiToken,
  },
});

const processarDados = async () => {
  const db = openDB();
  const allCardData = [];

  try {
    const responseCards = await trelloApi.get(`/boards/${idBoard}/cards`);
    const cards = responseCards.data;

    const responseLists = await trelloApi.get(`/boards/${idBoard}/lists`);
    const listsMap = responseLists.data.reduce((map, list) => {
      map[list.id] = list.name;
      return map;
    }, {});

    console.log(`Processando ${cards.length} cartões...`);

    for (const card of cards) {
      const cardId = card.id;
      const cardName = card.name;

      const responseActions = await trelloApi.get(`/cards/${cardId}/actions`, {
        params: {
          filter: "updateCard:idList,createCard",
        },
      });
      const actions = responseActions.data.reverse();

      let entryTime = null;

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const actionDate = new Date(action.date);
        const actionType = action.type;
        const listAfterId = action.data.listAfter?.id;

        if (actionType === "createCard") {
          entryTime = actionDate;
          continue;
        }

        if (actionType === "updateCard" && listAfterId) {
          const listAfterName = listsMap[listAfterId];

          if (entryTime === null) {
            entryTime = actionDate;
            continue;
          }

          if (i === actions.length - 1) {
            const timeDiff = new Date() - entryTime;
            const cycleTimeInSeconds = (timeDiff / 1000).toFixed(2);

            if (cycleTimeInSeconds > 0) {
              const period = entryTime.toLocaleDateString();
              allCardData.push([cardId, cardName, listAfterId, listAfterName, period, cycleTimeInSeconds]);
            }
            break;
          }

          const nextAction = actions[i + 1];
          if (nextAction) {
            const nextActionDate = new Date(nextAction.date);
            const listBeforeId = action.data.listBefore?.id;
            const listBeforeName = listsMap[listBeforeId];

            if (listBeforeId) {
              const timeDiff = nextActionDate - actionDate;
              const cycleTimeInSeconds = (timeDiff / 1000).toFixed(2);
              const period = actionDate.toLocaleDateString();
              
              if (cycleTimeInSeconds > 0) {
                allCardData.push([cardId, cardName, listBeforeId, listBeforeName, period, cycleTimeInSeconds]);
              }
            }
          }
        }
      }
    }
    
    if (allCardData.length > 0) {
      await db.run('BEGIN TRANSACTION;');
      const stmt = await db.prepare(`INSERT OR IGNORE INTO cards (card_id, card_name, list_id, list_name, period, cycle_time_secs) VALUES (?, ?, ?, ?, ?, ?);`);

      for (const data of allCardData) {
        await stmt.run(...data);
      }
      
      await stmt.finalize();
      await db.run('COMMIT;');
      console.log(`Sucesso! ${allCardData.length} registros inseridos.`);
    }

  } catch (error) {
    console.error("Erro ao processar dados:", error);
    await db.run('ROLLBACK;');
  } finally {
    db.close((err) => {
      if (err) {
        console.error("Erro ao fechar o banco de dados:", err.message);
      } else {
        console.log("Conexão com o banco de dados encerrada com sucesso.");
      }
    });
  }
};

processarDados();