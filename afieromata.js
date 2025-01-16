const { google } = require('googleapis');
const KEY_FILE_PATH = 'Quickstart-3330b5de2e63.json';

async function executeAfieromata() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth,
    });

    const PROPERTIES = [
        { id: '269754074', name: 'www.athensmagazine.gr' },
        { id: '275364433', name: 'www.youweekly.gr' },
        { id: '311944538', name: 'www.travelstyle.gr' },
    ];

    const results = [];

    for (const { id, name } of PROPERTIES) {
        const reportData = await fetchReport(analyticsData, id);
        results.push({ siteName: name, reportData });
    }

    return results;
}


module.exports = { executeAfieromata };