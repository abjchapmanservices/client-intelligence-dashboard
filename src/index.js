import clients from "../data/clients.json" with { type: "json" };


console.log("Client Intelligence Dashboard Started");


const activeClients = clients.filter(
  client => client.active === true
);


console.log(
  "Number of clients:",
  clients.length
);


console.log(
  "Active clients:",
  activeClients.length
);


for (const client of activeClients) {

  console.log("----------------------------");

  console.log("Client:", client.name);
  console.log("Teamwork:", client.teamworkProjectId);
  console.log("QuickBooks:", client.quickbooksCustomerId);
  console.log("Meta:", client.metaAdId);
  console.log("Google Ads:", client.googleAdsId);

}


console.log("----------------------------");

console.log("Complete");
