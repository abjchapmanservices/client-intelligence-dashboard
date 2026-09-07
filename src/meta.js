const insightCache = new Map();


function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}


function campaignMatches(
  campaignName,
  matchTerms
) {

  const normalizedCampaign =
    normalize(campaignName);


  for (const term of matchTerms) {

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
      return true;
    }
  }


  return false;
}


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


  const rows = [];


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


export async function getMeta(
  client,
  accessToken,
  date
) {

  try {

    const adAccountId =
      client.metaAdAccountId;


    const matchTerms =
      Array.isArray(
        client.metaMatch
      )
        ? client.metaMatch
        : [];


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
        error: "No Meta Token"
      };
    }


    if (
      matchTerms.length === 0
    ) {

      return {
        spend: "",
        impressions: "",
        clicks: "",
        matchedCampaigns: 0,
        matchedCampaignNames: [],
        success: false,
        error:
          "No Meta match terms configured"
      };
    }


    const campaigns =
      await getCampaignInsights(
        adAccountId,
        accessToken,
        date
      );


    let spend = 0;
    let impressions = 0;
    let clicks = 0;

    const matchedCampaignNames =
      [];


    for (const campaign of campaigns) {

      if (
        !campaignMatches(
          campaign.campaign_name,
          matchTerms
        )
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
        campaign.campaign_name || ""
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
