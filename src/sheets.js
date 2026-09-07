import { google } from "googleapis";


function getSheetsClient() {

  const clientEmail =
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  const privateKey =
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
      ?.replace(/\\n/g, "\n");


  if (!clientEmail) {
    throw new Error(
      "Missing GOOGLE_SHEETS_CLIENT_EMAIL"
    );
  }


  if (!privateKey) {
    throw new Error(
      "Missing GOOGLE_SHEETS_PRIVATE_KEY"
    );
  }


  const auth =
    new google.auth.JWT({
      email: clientEmail,

      key: privateKey,

      scopes: [
        "https://www.googleapis.com/auth/spreadsheets"
      ]
    });


  return google.sheets({
    version: "v4",
    auth
  });
}


function getSpreadsheetId() {

  const spreadsheetId =
    process.env
      .GOOGLE_SHEETS_SPREADSHEET_ID;


  if (!spreadsheetId) {

    throw new Error(
      "Missing GOOGLE_SHEETS_SPREADSHEET_ID"
    );
  }


  return spreadsheetId;
}


// ============================================
// DAILY DATA
// ============================================

export async function appendClientData(
  data
) {

  try {

    const spreadsheetId =
      getSpreadsheetId();

    const sheets =
      getSheetsClient();


    const values = [[

      data.date,

      data.client,

      data.metaSpend,
      data.metaImpressions,
      data.metaClicks,

      data.googleSpend,
      data.googleImpressions,
      data.googleClicks,

      data.teamworkHours,
      data.teamworkBillable,
      data.teamworkCost,
      data.teamworkExpenses,

      data.lastInvoice,

      data.quickbooksBalance,
      data.quickbooksOverdue,
      data.quickbooksStatus,
      data.quickbooksOpenInvoices

    ]];


    await sheets.spreadsheets.values.append({

      spreadsheetId,

      range:
        "Daily Data!A:Q",

      valueInputOption:
        "USER_ENTERED",

      insertDataOption:
        "INSERT_ROWS",

      requestBody: {
        values
      }

    });


    return {
      success: true,
      error: ""
    };


  } catch(error) {

    return {
      success: false,
      error:
        error.message
    };

  }
}


// ============================================
// CAMPAIGN MATCHING
// READ CURRENT MATCHES
// ============================================

export async function getCampaignMappings() {

  const spreadsheetId =
    getSpreadsheetId();

  const sheets =
    getSheetsClient();


  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId,

      range:
        "Campaign Matching!A2:C"

    });


  const rows =
    response.data.values || [];


  return rows.map(
    row => ({
      campaignName:
        String(row[0] || "").trim(),

      client:
        String(row[1] || "").trim(),

      adAccountId:
        String(row[2] || "").trim()
    })
  );
}


// ============================================
// CAMPAIGN MATCHING
// ADD NEW CAMPAIGNS
// ============================================

export async function appendCampaignMappings(
  mappings
) {

  if (
    !Array.isArray(mappings) ||
    mappings.length === 0
  ) {

    return {
      success: true,
      added: 0,
      error: ""
    };
  }


  try {

    const spreadsheetId =
      getSpreadsheetId();

    const sheets =
      getSheetsClient();


    const values =
      mappings.map(
        mapping => [

          mapping.campaignName || "",

          mapping.client || "",

          mapping.adAccountId || ""

        ]
      );


    await sheets.spreadsheets.values.append({

      spreadsheetId,

      range:
        "Campaign Matching!A:C",

      valueInputOption:
        "USER_ENTERED",

      insertDataOption:
        "INSERT_ROWS",

      requestBody: {
        values
      }

    });


    return {
      success: true,
      added:
        mappings.length,
      error: ""
    };


  } catch(error) {

    return {
      success: false,
      added: 0,
      error:
        error.message
    };
  }
}
