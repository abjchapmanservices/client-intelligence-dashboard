export async function getMeta(
  adAccountId,
  accessToken,
  date
) {

  try {

    if (!adAccountId) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        success: false,
        error: "No Meta Ad ID"
      };
    }


    if (!accessToken) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        success: false,
        error: "No Meta Token"
      };
    }


    const parts = date.split("-");

    const apiDate =
      `${parts[0]}-${parts[1]}-${parts[2]}`;


    const timeRange = JSON.stringify({
      since: apiDate,
      until: apiDate
    });


    const url =
      `https://graph.facebook.com/v26.0/act_${adAccountId}/insights` +
      `?fields=spend,impressions,clicks` +
      `&time_range=${encodeURIComponent(timeRange)}` +
      `&access_token=${encodeURIComponent(accessToken)}`;


    const response = await fetch(url);

    const data = await response.json();


    if (data.error) {
      throw new Error(data.error.message);
    }


    let spend = 0;
    let impressions = 0;
    let clicks = 0;


    if (
      data.data &&
      data.data.length > 0
    ) {

      const stats = data.data[0];

      spend = Number(stats.spend || 0);
      impressions = Number(stats.impressions || 0);
      clicks = Number(stats.clicks || 0);

    }


    return {

      spend,
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
