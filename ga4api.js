const { google } = require('googleapis');
const KEY_FILE_PATH = 'Quickstart-3330b5de2e63.json';

async function executeGA4Api() {
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

// Helper function to fetch data for a property from GA4 API
async function fetchReport(analyticsData, propertyId) {
    const request = {
        property: `properties/${propertyId}`,
        requestBody: {
            dimensions: [
                {name: 'date'},
            ],
            metrics: [
                {name: 'totalUsers'},
                {name: 'screenPageViews'},
                {name: 'screenPageViewsPerUser'},
                {name: 'engagementRate'},
                {name: 'userEngagementDuration'},
                {name: "activeUsers"},
                // {name: 'averageEngagementTime'},
            ],
            dateRanges: [
                {startDate: 'yesterday', endDate: 'yesterday'}, // Example date range
            ],
        },
    };

    try {
        const response = await analyticsData.properties.runReport(request);
        const rows = response.data.rows || [];
        return rows.map(row => {
            const userEngagementDuration = parseFloat(row.metricValues[4].value); // Convert to float
            const activeUsers = parseInt(row.metricValues[5].value, 10); // Convert to integer
            const avgEngagementTimePerUser = activeUsers > 0
                ? userEngagementDuration / activeUsers
                : 0; // Avoid division by zero

            return {
                date: row.dimensionValues[0].value,
                users: row.metricValues[0].value,
                pageviews: row.metricValues[1].value,
                viewsperuser: parseFloat(row.metricValues[2].value).toFixed(2),
                engagementRate: parseFloat(row.metricValues[3].value).toFixed(2),
                userEngagementDuration: row.metricValues[4].value,
                activeUsers: row.metricValues[5].value,
                averageEngagementTimePerUser: avgEngagementTimePerUser.toFixed(2), // Format to 2 decimal places
            };
        });
    } catch (error) {
        console.error(`Error fetching report for property ${propertyId}:`, error);
        return []; // Return an empty array if the request fails
    }
}

module.exports = { executeGA4Api };
