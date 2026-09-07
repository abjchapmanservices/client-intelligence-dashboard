async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
  });

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `OAuth failed: ${JSON.stringify(data)}`
    );
  }

  return data.access_token;
}


export async function getGoogleAds(
  customerId,
  date
) {

  try {

    if (!customerId) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        success: false,
        error: "No Google Ads ID"
      };
    }


    const cleanCustomerId =
      String(customerId).replace(/\D/g, "");


    const accessToken =
      await getAccessToken();


    const query = `
      SELECT
        campaign.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks
      FROM campaign
      WHERE segments.date = '${date}'
    `;


    const headers = {
      "Authorization":
        `Bearer ${accessToken}`,

      "developer-token":
        process.env.GOOGLE_ADS_DEVELOPER_TOKEN,

      "Content-Type":
        "application/json"
    };


    if (
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
    ) {

      headers["login-customer-id"] =
        String(
          process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        ).replace(/\D/g, "");
    }


    const response =
      await fetch(
        `https://googleads.googleapis.com/v25/customers/${cleanCustomerId}/googleAds:searchStream`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            query
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        JSON.stringify(data)
      );
    }


    let spendMicros = 0;
    let impressions = 0;
    let clicks = 0;


    for (const batch of data || []) {

      for (
        const result of
        batch.results || []
      ) {

        const metrics =
          result.metrics || {};


        spendMicros +=
          Number(
            metrics.costMicros || 0
          );


        impressions +=
          Number(
            metrics.impressions || 0
          );


        clicks +=
          Number(
            metrics.clicks || 0
          );

      }
    }


    return {

      spend:
        Number(
          (
            spendMicros /
            1000000
          ).toFixed(2)
        ),

      impressions,

      clicks,

      success: true,

      error: ""

    };


  } catch(error) {

    return {

      spend: 0,

      impressions: 0,

      clicks: 0,

      success: false,

      error:
        error.message

    };

  }

}
