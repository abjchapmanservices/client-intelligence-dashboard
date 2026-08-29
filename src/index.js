import clients from "../data/clients.json" with { type: "json" };

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


}


console.log("Complete");
