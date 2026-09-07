const siteName = "mentmarketingcreativeservices";

const apiKey = process.env.TEAMWORK_API_KEY;

const authHeader =
  "Basic " +
  Buffer.from(`${apiKey}:X`).toString("base64");


export async function getTeamworkData(
  projectId,
  date
) {

  try {

    if (!projectId) {
      return {
        hours: 0,
        billable: 0,
        cost: 0,
        expenses: 0,

        lastInvoice: "",
        lastInvoiceNumber: "",
        lastInvoiceDate: "",
        lastInvoiceHours: "",
        lastInvoiceAmount: "",

        success: false,
        error: "No Teamwork Project ID"
      };
    }


    // =====================================================
    // DATE SETUP
    // =====================================================

    const year = date.substring(0, 4);
    const month = date.substring(5, 7);
    const day = date.substring(8, 10);

    const startDate =
      `${year}-${month}-01`;

    const endDate =
      `${year}-${month}-${day}`;

    const targetDate =
      new Date(`${date}T23:59:59`);


    // =====================================================
    // TIME TOTALS
    // =====================================================

    const timeUrl =
      `https://${siteName}.teamwork.com/projects/api/v3/time/total.json` +
      `?projectId=${encodeURIComponent(projectId)}` +
      `&returnCostInfo=true` +
      `&returnBillableInfo=true` +
      `&startDate=${startDate}` +
      `&endDate=${endDate}`;


    const timeResponse =
      await fetch(
        timeUrl,
        {
          headers: {
            Authorization: authHeader
          }
        }
      );


    if (!timeResponse.ok) {
      throw new Error(
        `Teamwork time API error: ${timeResponse.status}`
      );
    }


    const timeData =
      await timeResponse.json();


    let hours =
      Number(
        timeData["time-totals"]?.minutesBillable || 0
      ) / 60;


    hours =
      Number(hours.toFixed(2));


    const billable =
      Number(
        timeData.financialTotals?.totalCostBillable || 0
      );


    const cost =
      Number(
        timeData.financialTotals?.totalCost || 0
      );


    // =====================================================
    // EXPENSES
    // =====================================================

    const expenseUrl =
      `https://${siteName}.teamwork.com/expenses.json` +
      `?startDate=${date}` +
      `&endDate=${date}`;


    const expenseResponse =
      await fetch(
        expenseUrl,
        {
          headers: {
            Authorization: authHeader
          }
        }
      );


    if (!expenseResponse.ok) {
      throw new Error(
        `Teamwork expense API error: ${expenseResponse.status}`
      );
    }


    const expenseData =
      await expenseResponse.json();


    let expenses = 0;


    for (
      const expense of
      expenseData.expenses || []
    ) {

      if (
        String(expense["project-id"]) ===
        String(projectId)
      ) {

        expenses =
          Number(expense.cost || 0);

        break;
      }
    }


    // =====================================================
    // GET ALL INVOICES
    // =====================================================

    const invoices =
      await getInvoices();


    // =====================================================
    // FIND MOST RECENT INVOICE
    // ON OR BEFORE TARGET DATE
    // =====================================================

    let latestInvoice = null;
    let latestInvoiceTimestamp = -1;


    for (
      const invoice of invoices
    ) {

      if (
        String(invoice["project-id"]) !==
        String(projectId)
      ) {
        continue;
      }


      let invoiceDateString = "";


      // Teamwork often returns display-date as YYYYMMDD

      if (invoice["display-date"]) {

        const displayDate =
          String(
            invoice["display-date"]
          ).trim();


        if (/^\d{8}$/.test(displayDate)) {

          invoiceDateString =
            `${displayDate.substring(0, 4)}-` +
            `${displayDate.substring(4, 6)}-` +
            `${displayDate.substring(6, 8)}`;

        }

        else if (
          /^\d{4}-\d{2}-\d{2}/.test(displayDate)
        ) {

          invoiceDateString =
            displayDate.substring(0, 10);

        }
      }


      // Fall back to date-created

      if (
        !invoiceDateString &&
        invoice["date-created"]
      ) {

        invoiceDateString =
          String(
            invoice["date-created"]
          ).substring(0, 10);
      }


      if (!invoiceDateString) {
        continue;
      }


      const invoiceDateObject =
        new Date(
          `${invoiceDateString}T00:00:00`
        );


      if (
        Number.isNaN(
          invoiceDateObject.getTime()
        )
      ) {
        continue;
      }


      // Ignore future invoices

      if (
        invoiceDateObject >
        targetDate
      ) {
        continue;
      }


      const invoiceTimestamp =
        invoiceDateObject.getTime();


      if (
        invoiceTimestamp >
        latestInvoiceTimestamp
      ) {

        latestInvoiceTimestamp =
          invoiceTimestamp;


        latestInvoice = {

          id:
            invoice.id,

          number:
            invoice.number || "",

          date:
            invoiceDateString,

          created:
            invoice["date-created"] || "",

          fixedCost:
            invoice["fixed-cost"] || 0

        };

      }

      // If same invoice date, choose newest created invoice

      else if (
        invoiceTimestamp ===
          latestInvoiceTimestamp &&
        latestInvoice
      ) {

        const currentCreated =
          new Date(
            invoice["date-created"] || 0
          ).getTime();


        const savedCreated =
          new Date(
            latestInvoice.created || 0
          ).getTime();


        if (
          currentCreated >
          savedCreated
        ) {

          latestInvoice = {

            id:
              invoice.id,

            number:
              invoice.number || "",

            date:
              invoiceDateString,

            created:
              invoice["date-created"] || "",

            fixedCost:
              invoice["fixed-cost"] || 0

          };
        }
      }
    }


    // =====================================================
    // LAST INVOICE DETAILS
    // =====================================================

    let lastInvoice = "";

    let lastInvoiceNumber = "";
    let lastInvoiceDate = "";
    let lastInvoiceHours = "";
    let lastInvoiceAmount = "";


    if (latestInvoice) {

      const invoiceDetails =
        await getInvoiceDetails(
          latestInvoice.id
        );


      // Invoice name / number

      lastInvoiceNumber =
        invoiceDetails.number ||
        latestInvoice.number ||
        "";


      // Invoice date

      lastInvoiceDate =
        latestInvoice.date;


      // ===================================================
      // AMOUNT
      // ===================================================

      const amountRaw =
        invoiceDetails["total-cost"] ??
        invoiceDetails["fixed-cost"] ??
        latestInvoice.fixedCost ??
        0;


      const amountNumber =
        Number.parseFloat(
          amountRaw || 0
        );


      if (
        !Number.isNaN(amountNumber)
      ) {

        lastInvoiceAmount =
          amountNumber.toFixed(2);

      } else {

        lastInvoiceAmount =
          "0.00";
      }


      // ===================================================
      // HOURS
      // ===================================================

      let invoiceHours =
        Number.parseFloat(
          invoiceDetails[
            "total-time-decimal"
          ]
        );


      // Fall back to invoice line items

      if (
        Number.isNaN(invoiceHours)
      ) {

        invoiceHours = 0;


        for (
          const item of
          invoiceDetails["line-items"] || []
        ) {

          const decimalHours =
            Number.parseFloat(
              item["decimal-hours"] || 0
            );


          if (
            !Number.isNaN(
              decimalHours
            )
          ) {

            invoiceHours +=
              decimalHours;
          }
        }
      }


      lastInvoiceHours =
        Number(
          invoiceHours || 0
        ).toFixed(2);


      // ===================================================
      // FORMAT DATE M/D/YYYY
      // ===================================================

      const dateParts =
        lastInvoiceDate.split("-");


      let formattedInvoiceDate =
        lastInvoiceDate;


      if (
        dateParts.length === 3
      ) {

        formattedInvoiceDate =
          `${Number(dateParts[1])}/` +
          `${Number(dateParts[2])}/` +
          `${dateParts[0]}`;
      }


      // ===================================================
      // FINAL SUMMARY
      // ===================================================

      lastInvoice =
        `${lastInvoiceNumber}- ` +
        `${formattedInvoiceDate}- ` +
        `${lastInvoiceHours}- ` +
        `$${lastInvoiceAmount}`;

    }


    // =====================================================
    // RETURN
    // =====================================================

    return {

      hours,
      billable,
      cost,
      expenses,

      lastInvoice,
      lastInvoiceNumber,
      lastInvoiceDate,
      lastInvoiceHours,
      lastInvoiceAmount,

      success: true,
      error: ""

    };


  } catch(error) {

    return {

      hours: 0,
      billable: 0,
      cost: 0,
      expenses: 0,

      lastInvoice: "",
      lastInvoiceNumber: "",
      lastInvoiceDate: "",
      lastInvoiceHours: "",
      lastInvoiceAmount: "",

      success: false,
      error: error.message

    };

  }
}


// =========================================================
// GET ALL INVOICES WITH PAGINATION
// =========================================================

async function getInvoices() {

  let allInvoices = [];

  let page = 1;
  let totalPages = 1;


  do {

    const url =
      `https://${siteName}.teamwork.com/invoices.json` +
      `?type=all&page=${page}`;


    const response =
      await fetch(
        url,
        {
          headers: {
            Authorization: authHeader
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `Teamwork invoice API error: ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      Array.isArray(
        data.invoices
      )
    ) {

      allInvoices.push(
        ...data.invoices
      );
    }


    const pagesHeader =
      response.headers.get(
        "x-pages"
      );


    if (pagesHeader) {

      totalPages =
        Number.parseInt(
          pagesHeader,
          10
        ) || 1;

    } else {

      totalPages = 1;
    }


    page++;


  } while (
    page <= totalPages
  );


  return allInvoices;
}


// =========================================================
// GET FULL INVOICE DETAILS
// =========================================================

async function getInvoiceDetails(
  invoiceId
) {

  const url =
    `https://${siteName}.teamwork.com/invoices/${invoiceId}.json`;


  const response =
    await fetch(
      url,
      {
        headers: {
          Authorization: authHeader
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `Teamwork invoice detail API error: ${response.status}`
    );
  }


  const data =
    await response.json();


  return data.invoice || {};
}
