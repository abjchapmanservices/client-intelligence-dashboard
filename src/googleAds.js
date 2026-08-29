import { GoogleAdsApi } from "google-ads-api";


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


    const client = new GoogleAdsApi({

      client_id:
        process.env.GOOGLE_ADS_CLIENT_ID,

      client_secret:
        process.env.GOOGLE_ADS_CLIENT_SECRET,

      developer_token:
        process.env.GOOGLE_ADS_DEVELOPER_TOKEN

    });


    const customer =
      client.Customer({

        customer_id: customerId,

        refresh_token:
          process.env.GOOGLE_ADS_REFRESH_TOKEN

      });


    const query = `

      SELECT

        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks

      FROM customer

      WHERE segments.date = '${date}'

    `;


    const rows =
      await customer.query(query);


    let spend = 0;
    let impressions = 0;
    let clicks = 0;


    if (rows.length > 0) {

      const metrics = rows[0].metrics;


      spend =
        Number(metrics.cost_micros || 0)
        / 1000000;


      impressions =
        Number(metrics.impressions || 0);


      clicks =
        Number(metrics.clicks || 0);

    }


    return {

      spend:
        Number(spend.toFixed(2)),

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

      error: error.message

    };

  }

}
