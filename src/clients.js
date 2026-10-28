import fallbackClients from "../data/clients.json" with { type: "json" };
import { google } from "googleapis";

let clientsPromise;

const asId = value => value == null || value === ""
  ? "" : String(value).trim().replace(/\.0$/, "");

export async function getClients() {
  if (!clientsPromise) {
    clientsPromise = loadClients().catch(error => {
      clientsPromise = null;
      throw error;
    });
  }
  return clientsPromise;
}

async function loadClients() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!email || !key || !spreadsheetId)
    throw new Error("Missing Google Sheets credentials or spreadsheet ID");

  const auth = new google.auth.JWT({
    email, key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'Client Source'!A2:H",
    valueRenderOption: "UNFORMATTED_VALUE"
  });

  const originals = new Map(
    fallbackClients.map(c => [c.name.trim().toLowerCase(), c])
  );
  const clients = [];
  const seen = new Set();
  for (const row of response.data.values || []) {
    const name = String(row[0] ?? "").trim();
    if (!name) continue;
    const normalized = name.toLowerCase();
    if (seen.has(normalized))
      throw new Error("Duplicate Client Source name: " + name);
    seen.add(normalized);

    const original = originals.get(normalized);
    const aliases = String(row[6] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    clients.push({
      name,
      teamworkProjectId: asId(row[1]),
      quickbooksCustomerId: asId(row[2]),
      metaAdAccountId: asId(row[3]),
      metaMatch: aliases.length ? aliases : (original?.metaMatch?.length ? original.metaMatch : [name]),
      googleAdsId: asId(row[4]),
      active: ["yes", "true", "1", "active"].includes(String(row[5] ?? "").trim().toLowerCase()),
      metaPaidBy: String(row[7] ?? "").trim()
    });
  }
  if (!clients.length)
    throw new Error("Client Source tab is empty; stopping to protect existing data");
  console.log("Loaded " + clients.length + " clients from Client Source");
  return clients;
}
