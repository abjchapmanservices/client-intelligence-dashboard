async function getAccessToken() {

  const clientId =
    process.env.QUICKBOOKS_CLIENT_ID;

  const clientSecret =
    process.env.QUICKBOOKS_CLIENT_SECRET;

  const refreshToken =
    process.env.QUICKBOOKS_REFRESH_TOKEN;


  const basicAuth =
    Buffer
      .from(
        `${clientId}:${clientSecret}`
      )
      .toString("base64");


  const body =
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });


  const response =
    await fetch(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Basic ${basicAuth}`,

          "Content-Type":
            "application/x-www-form-urlencoded",

          "Accept":
            "application/json"
        },

        body
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      `QuickBooks OAuth failed: ${JSON.stringify(data)}`
    );
  }


  return {
    accessToken:
      data.access_token,

    refreshToken:
      data.refresh_token || refreshToken
  };
}



export async function getQuickBooksData(
  customerId,
  date
) {

  try {

    if (!customerId) {

      return {
        balance: 0,
        overdueBalance: 0,
        status: "good",
        openInvoices: 0,
        success: false,
        error:
          "No QuickBooks Customer ID"
      };
    }


    const realmId =
      process.env.QUICKBOOKS_REALM_ID;


    if (!realmId) {

      throw new Error(
        "Missing QUICKBOOKS_REALM_ID"
      );
    }


    const auth =
      await getAccessToken();


    const accessToken =
      auth.accessToken;


    // =========================================
    // GET CUSTOMER
    // =========================================

    const customerQuery =
      `SELECT * FROM Customer WHERE Id = '${customerId}'`;


    const customerData =
      await quickBooksQuery(
        realmId,
        accessToken,
        customerQuery
      );


    const customers =
      customerData
        .QueryResponse
        ?.Customer || [];


    if (customers.length === 0) {

      throw new Error(
        `QuickBooks customer ${customerId} not found`
      );
    }


    const customer =
      customers[0];


    const balance =
      Number(
        customer.Balance || 0
      );


    // =========================================
    // GET OPEN INVOICES FOR CUSTOMER
    // =========================================

    const invoiceQuery =
      `SELECT * FROM Invoice ` +
      `WHERE CustomerRef = '${customerId}' ` +
      `AND Balance > '0'`;


    const invoiceData =
      await quickBooksQuery(
        realmId,
        accessToken,
        invoiceQuery
      );


    const invoices =
      invoiceData
        .QueryResponse
        ?.Invoice || [];


    // =========================================
    // CALCULATE OVERDUE BALANCE
    // =========================================

    const targetDate =
      new Date(
        `${date}T23:59:59`
      );


    let overdueBalance = 0;
    let openInvoices = 0;


    for (
      const invoice of invoices
    ) {

      const invoiceBalance =
        Number(
          invoice.Balance || 0
        );


      if (
        invoiceBalance <= 0
      ) {
        continue;
      }


      openInvoices++;


      const dueDate =
        invoice.DueDate;


      if (!dueDate) {
        continue;
      }


      const dueDateObject =
        new Date(
          `${dueDate}T00:00:00`
        );


      if (
        dueDateObject <
        targetDate
      ) {

        overdueBalance +=
          invoiceBalance;
      }
    }


    overdueBalance =
      Number(
        overdueBalance.toFixed(2)
      );


    const status =
      overdueBalance > 0
        ? "overdue"
        : "good";


    return {

      balance:
        Number(
          balance.toFixed(2)
        ),

      overdueBalance,

      status,

      openInvoices,

      success: true,
      error: "",

      newRefreshToken:
        auth.refreshToken
    };


  } catch(error) {

    return {

      balance: 0,
      overdueBalance: 0,
      status: "error",
      openInvoices: 0,

      success: false,

      error:
        error.message
    };

  }
}



async function quickBooksQuery(
  realmId,
  accessToken,
  query
) {

  const url =
    `https://quickbooks.api.intuit.com/v3/company/${realmId}/query` +
    `?query=${encodeURIComponent(query)}`;


  const response =
    await fetch(
      url,
      {
        headers: {

          "Authorization":
            `Bearer ${accessToken}`,

          "Accept":
            "application/json"
        }
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      `QuickBooks API failed: ${JSON.stringify(data)}`
    );
  }


  return data;
}
