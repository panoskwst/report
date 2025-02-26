const { google } = require("googleapis");
const { getAdSenseAuth } = require("./google-auth");


async function getAdSenseReport() {
    console.log("I run.");
    const auth = await getAdSenseAuth();
    const adsense = google.adsense("v2");

    const accountRes = await adsense.accounts.list({ auth });
    const account = accountRes.data.accounts?.[0]?.name;

    if (!account) {
        console.log("No Adsense account found.");
        return;
    }

    console.log("Fetching report for:", account);

    const reportRes = await adsense.accounts.reports.generate({
        auth,
        name: account,
        dateRange: "YESTERDAY",
        metrics: ["ESTIMATED_EARNINGS"],
        dimensions: ["DATE", "SITE_NAME"],
    });

    console.log("Adsense Daily Earnings Report:");
    console.table(reportRes.data.rows);
}

getAdSenseReport();
module.exports = { getAdSenseReport };