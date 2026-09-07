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



export async function appendClientData(
  data
) {

  try {

    const spreadsheetId =
      process.env
        .GOOGLE_SHEETS_SPREADSHEET_ID;


    if (!spreadsheetId) {

      throw new Error(
        "Missing GOOGLE_SHEETS_SPREADSHEET_ID"
      );
    }


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
