import clients from "../data/clients.json" with { type: "json" };

import { getMeta } from "./meta.js";
import { getGoogleAds } from "./googleAds.js";
import { getTeamworkData } from "./apis/teamwork.js";
import { appendClientData } from "./sheets.js";


console.log(
  "Client Intelligence Historical Backfill Started"
);


const START_DATE = "2026-09-06";
const END_DATE = "2026-09-06";


function getDates(start, end) {

  const dates = [];

  const current =
    new Date(`${start}T12:00:00Z`);

  const final =
    new Date(`${end}T12:00:00Z`);


  while (current <= final) {

    dates.push(
      current
        .toISOString()
        .slice(0, 10)
    );

    current.setUTCDate(
      current.getUTCDate() + 1
    );
  }


  return dates;
}


function wait(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );
}


const dates =
  getDates(
    START_DATE,
    END_DATE
  );


console.log(
  "Clients:",
  clients.length
);

console.log(
  "Dates:",
  dates.length
);

console.log(
  "Expected rows:",
  clients.length *
  dates.length
);


for (const date of dates) {

  console.log(
    "================================"
  );

  console.log(
    "Processing Date:",
    date
  );


  for (const client of clients) {

    console.log(
      `${date} | ${client.name}`
    );


    // ============================
    // META
    // ============================

    let meta = {
      spend: "",
      impressions: "",
      clicks: "",
      success: false,
      error: ""
    };
    
    
    if (client.metaAdId) {
    
      meta =
        await getMeta(
          client,
          process.env.META_ACCESS_TOKEN,
          date
        );
    }


    // ============================
    // GOOGLE ADS
    // ============================

    let google = {
      spend: "",
      impressions: "",
      clicks: "",
      success: false,
      error: ""
    };


    if (client.googleAdsId) {

      google =
        await getGoogleAds(
          client.googleAdsId,
          date
        );
    }


    // ============================
    // TEAMWORK
    // ============================

    let teamwork = {
      hours: "",
      billable: "",
      cost: "",
      expenses: "",
      lastInvoice: "",
      success: false,
      error: ""
    };


    if (client.teamworkProjectId) {

      teamwork =
        await getTeamworkData(
          client.teamworkProjectId,
          date
        );
    }


    // ============================
    // QUICKBOOKS
    // HISTORICAL DATA DISABLED
    // UNTIL HISTORICAL LOGIC BUILT
    // ============================

    const quickbooks = {
      balance: "",
      overdueBalance: "",
      status: "",
      openInvoices: ""
    };


    // ============================
    // WRITE ROW
    // ============================

    const sheetResult =
      await appendClientData({

        date,

        client:
          client.name,

        metaSpend:
          meta.spend,

        metaImpressions:
          meta.impressions,

        metaClicks:
          meta.clicks,

        googleSpend:
          google.spend,

        googleImpressions:
          google.impressions,

        googleClicks:
          google.clicks,

        teamworkHours:
          teamwork.hours,

        teamworkBillable:
          teamwork.billable,

        teamworkCost:
          teamwork.cost || "",

        teamworkExpenses:
          teamwork.expenses,

        lastInvoice:
          teamwork.lastInvoice,

        quickbooksBalance:
          quickbooks.balance,

        quickbooksOverdue:
          quickbooks.overdueBalance,

        quickbooksStatus:
          quickbooks.status,

        quickbooksOpenInvoices:
          quickbooks.openInvoices

      });


    if (!sheetResult.success) {

      console.log(
        "Sheets Error:",
        sheetResult.error
      );
    }


    if (
      meta.error &&
      client.metaAdId
    ) {

      console.log(
        "Meta Error:",
        meta.error
      );
    }

    console.log(
      "Meta Matched Campaigns:",
      meta.matchedCampaigns
    );
    
    console.log(
      "Meta Campaign Names:",
      meta.matchedCampaignNames
    );


    if (
      google.error &&
      client.googleAdsId
    ) {

      console.log(
        "Google Error:",
        google.error
      );
    }


    if (
      teamwork.error &&
      client.teamworkProjectId
    ) {

      console.log(
        "Teamwork Error:",
        teamwork.error
      );
    }


    // Small delay to reduce
    // API rate-limit pressure

    await wait(1000);

  }
}


console.log(
  "Historical Backfill Complete"
);
