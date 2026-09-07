import clients from "../data/clients.json" with { type: "json" };
import { getGoogleAds } from "./googleAds.js";
import { getTeamworkData } from "./apis/teamwork.js";
import { getQuickBooksData } from "./quickbooks.js";
import {
  appendClientData
} from "./sheets.js";

import { getMeta } from "./meta.js";


console.log("Client Intelligence Dashboard Started");

const date =
  new Date()
    .toLocaleDateString(
      "en-CA",
      {
        timeZone: "America/Chicago"
      }
    );


const activeClients = clients.filter(
  client => client.active === true
);


for (const client of activeClients) {


  console.log("----------------------------");

  console.log(
    "Client:",
    client.name
  );


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
    "Meta Success:",
    meta.success
  );


  console.log(
    "Meta Error:",
    meta.error
  );
const google =
  await getGoogleAds(
    client.googleAdsId,
    date
  );


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

console.log(
  "Google Error:",
  google.error
);
const teamwork =
  await getTeamworkData(
    client.teamworkProjectId,
    date
  );


console.log("Teamwork Hours:", teamwork.hours);
console.log("Teamwork Billable:", teamwork.billable);
console.log("Teamwork Expenses:", teamwork.expenses);
console.log("Last Invoice:", teamwork.lastInvoice);
console.log("Teamwork Success:", teamwork.success);
console.log("Teamwork Error:", teamwork.error);


// QUICKBOOKS

const quickbooks =
  await getQuickBooksData(
    client.quickbooksCustomerId,
    date
  );


console.log(
  "QuickBooks Balance:",
  quickbooks.balance
);

console.log(
  "QuickBooks Overdue:",
  quickbooks.overdueBalance
);

console.log(
  "QuickBooks Status:",
  quickbooks.status
);

console.log(
  "QuickBooks Open Invoices:",
  quickbooks.openInvoices
);

console.log(
  "QuickBooks Success:",
  quickbooks.success
);

console.log(
  "QuickBooks Error:",
  quickbooks.error
);

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
      teamwork.cost || 0,

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


console.log(
  "Sheets Success:",
  sheetResult.success
);

console.log(
  "Sheets Error:",
  sheetResult.error
);


// CLOSE CLIENT LOOP
}


console.log("Complete");
