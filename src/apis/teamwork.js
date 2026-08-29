const siteName = "mentmarketingcreativeservices";

const apiKey = process.env.TEAMWORK_API_KEY;


const authHeader =
  "Basic " + btoa(`${apiKey}:X`);



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
        success: false,
        error: "No Teamwork Project ID"
      };
    }


    const year = date.substring(0,4);
    const month = date.substring(5,7);
    const day = date.substring(8,10);


    const startDate =
      `${year}-${month}-01`;

    const endDate =
      `${year}-${month}-${day}`;



    // TIME TOTALS

    const timeResponse =
      await fetch(
        `https://${siteName}.teamwork.com/projects/api/v3/time/total.json?projectId=${projectId}&returnCostInfo=true&returnBillableInfo=true&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            authorization: authHeader
          }
        }
      );


    const timeData =
      await timeResponse.json();



    let hours =
      Number(
        timeData["time-totals"]?.minutesBillable || 0
      ) / 60;


    hours =
      Number(hours.toFixed(2));


    const billable =
      timeData.financialTotals?.totalCostBillable || 0;


    const cost =
      timeData.financialTotals?.totalCost || 0;



    // EXPENSES

    const expenseResponse =
      await fetch(
        `https://${siteName}.teamwork.com/expenses.json?startDate=${date}&endDate=${date}`,
        {
          headers: {
            authorization: authHeader
          }
        }
      );


    const expenseData =
      await expenseResponse.json();


    let expenses = 0;


    for (
      const expense of expenseData.expenses || []
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



    // INVOICES

    const invoices =
      await getInvoices();


    let latestInvoice = null;


    const targetDate =
      new Date(`${date}T23:59:59`);



    for (
      const invoice of invoices
    ) {

      if (
        String(invoice["project-id"]) !==
        String(projectId)
      ) {
        continue;
      }


      const invoiceDate =
        invoice["date-created"]?.substring(0,10);


      if (!invoiceDate) {
        continue;
      }


      const invoiceObject =
        new Date(`${invoiceDate}T00:00:00`);


      if (
        invoiceObject <= targetDate
      ) {

        if (
          !latestInvoice ||
          invoiceObject >
          new Date(`${latestInvoice.date}T00:00:00`)
        ) {

          latestInvoice = {
            number: invoice.number || "",
            date: invoiceDate,
            amount: invoice["fixed-cost"] || 0
          };

        }
      }
    }



    let invoiceSummary = "";


    if (latestInvoice) {

      invoiceSummary =
        `${latestInvoice.number}- ${latestInvoice.date}- $${latestInvoice.amount}`;

    }



    return {

      hours,
      billable,
      cost,
      expenses,

      lastInvoice:
        invoiceSummary,

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

      success: false,
      error: error.message

    };

  }

}




async function getInvoices() {

  const response =
    await fetch(
      `https://${siteName}.teamwork.com/invoices.json?type=all`,
      {
        headers: {
          authorization: authHeader
        }
      }
    );


  const data =
    await response.json();


  return data.invoices || [];

}
