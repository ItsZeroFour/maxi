import { google } from "googleapis";
import serviceAccount from "../data/sheet-key.json" assert { type: "json" };
import User from "../models/User.js";

const SPREADSHEET_ID = "19o6ygoCrRZ6I09zOgYrm4le-CdZlM8urp2vjappCuRc";
const SHEET_TITLE = "Sheet1";
const MAX_LEVEL = 30;

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

function toColumnName(num) {
  let s = "";
  while (num > 0) {
    let mod = (num - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    num = Math.floor((num - mod) / 26);
  }
  return s;
}

function todayStr() {
  return new Date().toLocaleDateString("ru-RU");
}

async function ensureMetricsColumn(sheets) {
  const metrics = [["Метрика"], ["Всего юзеров в базе"]];
  for (let i = 1; i <= MAX_LEVEL; i++) {
    metrics.push([`Прошли ${i} уровень`]);
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_TITLE}!A1:A${metrics.length}`,
    valueInputOption: "RAW",
    requestBody: { values: metrics },
  });
}

async function getOrCreateTodayColumn(sheets) {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_TITLE}!1:1`,
    majorDimension: "ROWS",
  });
  const headerRow = (headerRes.data.values && headerRes.data.values[0]) || [];

  const date = todayStr();
  let colIndex = headerRow.findIndex((v) => v === date);
  if (colIndex !== -1) {
    return colIndex + 1;
  }

  let nextColNum = Math.max(2, headerRow.length + 1);

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [SHEET_TITLE],
    includeGridData: false,
  });
  const sheet = meta.data.sheets[0];
  const sheetId = sheet.properties.sheetId;
  const currentCols = sheet.properties.gridProperties.columnCount;

  if (nextColNum > currentCols) {
    const need = nextColNum - currentCols;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            appendDimension: {
              sheetId,
              dimension: "COLUMNS",
              length: Math.max(need, 10),
            },
          },
        ],
      },
    });
  }

  const colLetter = toColumnName(nextColNum);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_TITLE}!${colLetter}1:${colLetter}1`,
    valueInputOption: "RAW",
    requestBody: { values: [[date]] },
  });

  return nextColNum;
}

async function getStats() {
  const groups = await User.aggregate([
    {
      $project: {
        len: { $size: { $ifNull: ["$completedLevels", []] } },
      },
    },
    {
      $group: {
        _id: "$len",
        c: { $sum: 1 },
      },
    },
  ]);

  const totalUsers = groups.reduce((acc, g) => acc + g.c, 0);

  const byLen = new Map(groups.map((g) => [g._id, g.c]));

  const result = { totalUsers };
  for (let i = 1; i <= MAX_LEVEL; i++) {
    let sum = 0;
    for (const [len, count] of byLen) {
      if (len >= i) sum += count;
    }
    result[i] = sum;
  }
  return result;
}

async function writeStatsToColumn(sheets, colNum, stats) {
  const colLetter = toColumnName(colNum);

  const values = [[stats.totalUsers]];
  for (let i = 1; i <= MAX_LEVEL; i++) {
    values.push([stats[i]]);
  }

  const startRow = 2;
  const endRow = 1 + 1 + MAX_LEVEL;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_TITLE}!${colLetter}${startRow}:${colLetter}${endRow}`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export async function exportDailyStatsOnce() {
  const sheets = await getSheetsClient();
  await ensureMetricsColumn(sheets);
  const colNum = await getOrCreateTodayColumn(sheets);
  const stats = await getStats();
  await writeStatsToColumn(sheets, colNum, stats);
  console.log(
    `Обновлен дневной срез за ${todayStr()} (столбец ${toColumnName(colNum)})`
  );
}
