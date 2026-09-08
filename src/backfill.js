import clients from "../data/clients.json" with { type: "json" };

import { getMeta } from "./meta.js";
import { getGoogleAds } from "./googleAds.js";
import { getTeamworkData } from "./apis/teamwork.js";
import { appendClientData } from "./sheets.js";


console.log(
  "Client Intelligence Historical Backfill Started"
);


const START_DATE = "2026-06-01";
const END_DATE = "2026-07-31";


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

    const meta =
      await getMeta(
        client,
        process.env.META_ACCESS_TOKEN,
        date
      );


    console.log(
      "Meta Spend:",
      meta.spend
    );

    console.log(
      "Meta Impressions:",
      meta.impressions
    );

    console.log(
      "Meta Clicks:",
      meta.clicks
    );

    console.log(
      "Meta Matched Campaigns:",
      meta.matchedCampaigns
    );

    console.log(
      "Meta Campaign Names:",
      meta.matchedCampaignNames
    );

    console.log(
      "Meta Success:",
      meta.success
    );

    if (meta.error) {

      console.log(
        "Meta Error:",
        meta.error
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


    console.log(
      "Google Spend:",
      google.spend
    );

    console.log(
      "Google Impressions:",
      google.impressions
    );

    console.log(
      "Google Clicks:",
      google.clicks
    );

    console.log(
      "Google Success:",
      google.success
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


    console.log(
      "Teamwork Hours:",
      teamwork.hours
    );

    console.log(
      "Teamwork Billable:",
      teamwork.billable
    );

    console.log(
      "Teamwork Cost:",
      teamwork.cost
    );

    console.log(
      "Teamwork Expenses:",
      teamwork.expenses
    );

    console.log(
      "Teamwork Last Invoice:",
      teamwork.lastInvoice
    );

    console.log(
      "Teamwork Success:",
      teamwork.success
    );


    if (
      teamwork.error &&
      client.teamworkProjectId
    ) {

      console.log(
        "Teamwork Error:",
        teamwork.error
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

    } else {

      console.log(
        "Sheets Success: true"
      );
    }


    console.log(
      "--------------------------------"
    );


    // Reduce API pressure between clients

    await wait(1000);

  }
}


console.log(
  "Historical Backfill Complete"
);
