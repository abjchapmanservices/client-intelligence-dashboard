import clients from "../data/clients.json" with { type: "json" };
import { getGoogleAds } from "./googleAds.js";
import { getTeamworkData } from "./apis/teamwork.js";

import { getMeta } from "./meta.js";


console.log("Client Intelligence Dashboard Started");


const activeClients = clients.filter(
  client => client.active === true
);


for (const client of activeClients) {


  console.log("----------------------------");

  console.log(
    "Client:",
    client.name
  );


  const meta = await getMeta(
    client.metaAdId,
    process.env.META_ACCESS_TOKEN,
    "2026-08-20"
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
    "2026-08-20"
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
    "2026-08-20"
  );


console.log("Teamwork Hours:", teamwork.hours);
console.log("Teamwork Billable:", teamwork.billable);
console.log("Teamwork Expenses:", teamwork.expenses);
console.log("Last Invoice:", teamwork.lastInvoice);
console.log("Teamwork Success:", teamwork.success);
console.log("Teamwork Error:", teamwork.error);
}


console.log("Complete");
