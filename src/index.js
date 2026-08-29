import clients from "../data/clients.json";


console.log("Client Intelligence Dashboard Started");


console.log(
  "Number of clients:",
  clients.length
);


for (const client of clients) {

  console.log("----------------------------");

  console.log(
    "Client:",
    client.name
  );

  console.log(
    "Teamwork:",
    client.teamworkProjectId
  );

  console.log(
    "QuickBooks:",
    client.quickbooksCustomerId
  );

  console.log(
    "Meta:",
    client.metaAdId
  );

  console.log(
    "Google Ads:",
    client.googleAdsId
  );
}


console.log("----------------------------");

console.log("Complete");
