import clients from "../data/clients.json" with {
  type: "json"
};

import {
  getCampaignMappings,
  appendCampaignMappings
} from "./sheets.js";


const insightCache =
  new Map();

let campaignMappingPromise =
  null;

const preparedAccountDates =
  new Set();


// ============================================
// NORMALIZATION
// ============================================

function normalize(value) {

  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}


function mappingKey(
  campaignName,
  adAccountId
) {

  return (
    `${String(adAccountId || "").trim()}|` +
    normalize(campaignName)
  );
}


// ============================================
// LOAD CAMPAIGN MATCHING TAB
// ============================================

async function loadCampaignMappingMap() {

  const rows =
    await getCampaignMappings();


  const map =
    new Map();


  for (const row of rows) {

    if (!row.campaignName) {
      continue;
    }


    const key =
      mappingKey(
        row.campaignName,
        row.adAccountId
      );


    map.set(
      key,
      {
        campaignName:
          row.campaignName,

        client:
          row.client,

        adAccountId:
          row.adAccountId
      }
    );
  }


  return map;
}


async function getCampaignMappingMap() {

  if (!campaignMappingPromise) {

    campaignMappingPromise =
      loadCampaignMappingMap();
  }


  return campaignMappingPromise;
}


// ============================================
// AUTO-SUGGEST CLIENT
// FOR A NEW CAMPAIGN
// ============================================

function suggestClientForCampaign(
  campaignName,
  adAccountId
) {

  const normalizedCampaign =
    normalize(campaignName);


  const possibleMatches =
    [];


  for (const client of clients) {

    if (
      String(
        client.metaAdAccountId || ""
      ).trim() !==
      String(
        adAccountId || ""
      ).trim()
    ) {

      continue;
    }


    const terms =
      Array.isArray(
        client.metaMatch
      )
        ? client.metaMatch
        : [];


    for (const term of terms) {

      const normalizedTerm =
        normalize(term);


      if (!normalizedTerm) {
        continue;
      }


      if (
        normalizedCampaign.includes(
          normalizedTerm
        )
      ) {

        possibleMatches.push({
          client:
            client.name,

          term:
            normalizedTerm,

          length:
            normalizedTerm.length
        });
      }
    }
  }


  if (
    possibleMatches.length === 0
  ) {

    return "";
  }


  possibleMatches.sort(
    (a, b) =>
      b.length - a.length
  );


  const bestLength =
    possibleMatches[0].length;


  const bestClients =
    [
      ...new Set(
        possibleMatches
          .filter(
            match =>
              match.length ===
              bestLength
          )
          .map(
            match =>
              match.client
          )
      )
    ];


  if (
    bestClients.length !== 1
  ) {

    return "";
  }


  return bestClients[0];
}


// ============================================
// META API
// ============================================

async function fetchCampaignInsights(
  adAccountId,
  accessToken,
  date
) {

  const timeRange =
    JSON.stringify({
      since: date,
      until: date
    });


  let url =
    `https://graph.facebook.com/v26.0/act_${adAccountId}/insights` +
    `?level=campaign` +
    `&fields=campaign_id,campaign_name,spend,impressions,clicks` +
    `&time_range=${encodeURIComponent(timeRange)}` +
    `&limit=500` +
    `&access_token=${encodeURIComponent(accessToken)}`;


  const rows =
    [];


  while (url) {

    const response =
      await fetch(url);


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error?.message ||
        `Meta API error: ${response.status}`
      );
    }


    if (
      Array.isArray(data.data)
    ) {

      rows.push(
        ...data.data
      );
    }


    url =
      data.paging?.next || "";
  }


  console.log(
    `Meta Account ${adAccountId}: ${rows.length} campaign rows on ${date}`
  );


  return rows;
}


async function getCampaignInsights(
  adAccountId,
  accessToken,
  date
) {

  const cacheKey =
    `${adAccountId}|${date}`;


  if (
    insightCache.has(cacheKey)
  ) {

    return insightCache.get(
      cacheKey
    );
  }


  const request =
    fetchCampaignInsights(
      adAccountId,
      accessToken,
      date
    );


  insightCache.set(
    cacheKey,
    request
  );


  return request;
}


// ============================================
// DISCOVER NEW CAMPAIGNS AND
// WRITE THEM TO GOOGLE SHEETS
// ============================================

async function prepareCampaignMappings(
  campaigns,
  adAccountId,
  date
) {

  const preparationKey =
    `${adAccountId}|${date}`;


  if (
    preparedAccountDates.has(
      preparationKey
    )
  ) {

    return;
  }


  preparedAccountDates.add(
    preparationKey
  );


  const mappingMap =
    await getCampaignMappingMap();


  const newMappings =
    [];


  for (const campaign of campaigns) {

    const campaignName =
      String(
        campaign.campaign_name || ""
      ).trim();


    if (!campaignName) {
      continue;
    }


    const key =
      mappingKey(
        campaignName,
        adAccountId
      );


    if (
      mappingMap.has(key)
    ) {

      continue;
    }


    const suggestedClient =
      suggestClientForCampaign(
        campaignName,
        adAccountId
      );


    const newMapping = {
      campaignName,
      client:
        suggestedClient,
      adAccountId:
        String(adAccountId)
    };


    newMappings.push(
      newMapping
    );


    // Add immediately to memory
    // so this run can use it.

    mappingMap.set(
      key,
      newMapping
    );
  }


  if (
    newMappings.length === 0
  ) {

    return;
  }


  const result =
    await appendCampaignMappings(
      newMappings
    );


  if (!result.success) {

    throw new Error(
      `Campaign Matching sheet error: ${result.error}`
    );
  }


  console.log(
    `Added ${result.added} new campaigns to Campaign Matching`
  );


  for (
    const mapping of newMappings
  ) {

    console.log(
      `Campaign: ${mapping.campaignName} -> ${mapping.client || "UNMATCHED"}`
    );
  }
}


// ============================================
// GET META DATA FOR CLIENT
// ============================================

export async function getMeta(
  client,
  accessToken,
  date
) {

  try {

    const adAccountId =
      String(
        client.metaAdAccountId || ""
      ).trim();


    if (!adAccountId) {

      return {
        spend: "",
        impressions: "",
        clicks: "",
        matchedCampaigns: 0,
        matchedCampaignNames: [],
        success: true,
        error: ""
      };
    }


    if (!accessToken) {

      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        matchedCampaigns: 0,
        matchedCampaignNames: [],
        success: false,
        error:
          "No Meta Token"
      };
    }


    const campaigns =
      await getCampaignInsights(
        adAccountId,
        accessToken,
        date
      );


    await prepareCampaignMappings(
      campaigns,
      adAccountId,
      date
    );


    const mappingMap =
      await getCampaignMappingMap();


    let spend = 0;
    let impressions = 0;
    let clicks = 0;


    const matchedCampaignNames =
      [];


    for (
      const campaign of campaigns
    ) {

      const campaignName =
        String(
          campaign.campaign_name || ""
        ).trim();


      if (!campaignName) {
        continue;
      }


      const key =
        mappingKey(
          campaignName,
          adAccountId
        );


      const mapping =
        mappingMap.get(key);


      if (!mapping) {
        continue;
      }


      if (
        normalize(mapping.client) !==
        normalize(client.name)
      ) {

        continue;
      }


      spend +=
        Number(
          campaign.spend || 0
        );


      impressions +=
        Number(
          campaign.impressions || 0
        );


      clicks +=
        Number(
          campaign.clicks || 0
        );


      matchedCampaignNames.push(
        campaignName
      );
    }


    return {

      spend:
        Number(
          spend.toFixed(2)
        ),

      impressions,

      clicks,

      matchedCampaigns:
        matchedCampaignNames.length,

      matchedCampaignNames,

      success: true,

      error: ""

    };


  } catch(error) {

    return {

      spend: 0,
      impressions: 0,
      clicks: 0,

      matchedCampaigns: 0,

      matchedCampaignNames: [],

      success: false,

      error:
        error.message

    };
  }
}
