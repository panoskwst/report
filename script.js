const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const { Client } = require('@microsoft/microsoft-graph-client');
const {google} = require('googleapis');
require('isomorphic-fetch');

// Replace with your credentials
// const CHARTBEAT_API_KEY = 'YOUR_CHARTBEAT_API_KEY';
// const SITE_HOST = 'yourwebsite.com'; // e.g., example.com
// const ONE_DRIVE_FOLDER_ID = 'YOUR_ONEDRIVE_FOLDER_ID'; // Replace with your OneDrive folder ID
// const ACCESS_TOKEN = 'YOUR_MICROSOFT_GRAPH_ACCESS_TOKEN'; // Replace with a valid access token

const PROPERTY_IDS = ['269754074','275364433','311944538'];
// const PROPERTY_ID = '275364433';

const KEY_FILE_PATH = 'Quickstart-3330b5de2e63.json';

// Fetch Chartbeat data for a specific day
// async function fetchPageviews(date) {
//     const url = `https://api.chartbeat.com/historical/traffic?apikey=${CHARTBEAT_API_KEY}&host=${SITE_HOST}&start=${date}&end=${date}`;
//     try {
//         const response = await axios.get(url);
//         return response.data;
//     } catch (error) {
//         console.error('Error fetching Chartbeat data:', error);
//         throw error;
//     }
// }


// Initialize the Google Analytics Data API client
async function initializeAnalytics() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    return google.analyticsdata({
        version: 'v1beta',
        auth,
    });

}


async function fetchReport(analyticsData,propertyId) {
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


// Generate an Excel file
function generateExcel(data, outputFile) {
    const rows = [[
        'Site',
        'Date',
        'Total Users', 
        'Pageviews',
        'Views per user',
        'Engagement rate', 
        'Average engagement time'
    ]]; // Header row

    data.forEach(({ propertyId, reportData }) => {
        // Add a row for the property ID
        rows.push([`Property ID: ${propertyId}`, '', '', '', '', '', '']);

        // Add the report data for this property
        reportData.forEach(page => {
            const avgEngagementTimeSec = parseFloat(page.averageEngagementTimePerUser);
            const minutes = Math.floor(avgEngagementTimeSec / 60);
            const seconds = Math.round(avgEngagementTimeSec % 60);
            const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            rows.push([
                '',
                page.date,
                page.users,
                page.pageviews,
                page.viewsperuser,
                page.engagementRate,
                formattedTime,
            ]);
        });
    });

    const worksheet = xlsx.utils.aoa_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Analytics');

    xlsx.writeFile(workbook, outputFile);
    console.log(`Excel file generated: ${outputFile}`);
}

// Upload the Excel file to OneDrive
// async function uploadToOneDrive(filePath) {
//     const fileName = filePath.split('/').pop();

//     const client = Client.init({
//         authProvider: (done) => done(null, ACCESS_TOKEN),
//     });

//     try {
//         const fileContent = fs.readFileSync(filePath);
//         const response = await client
//             .api(`/me/drive/items/${ONE_DRIVE_FOLDER_ID}:/${fileName}:/content`)
//             .put(fileContent);

//         console.log('File uploaded to OneDrive:', response.webUrl);
//     } catch (error) {
//         console.error('Error uploading to OneDrive:', error);
//         throw error;
//     }
// }

// Main function
(async function () {
    const date = '2024-12-01'; // Replace with your desired date
    const outputFile = 'AnalyticsReport.xlsx';

    try {
        // Step 1: Fetch pageviews
        const analyticsData = await initializeAnalytics();
        const allData = [];

        for (const propertyId of PROPERTY_IDS) {
            console.log(`Fetching data for Property ID: ${propertyId}`);
            const reportData = await fetchReport(analyticsData, propertyId);
            allData.push({ propertyId, reportData });
        }
        generateExcel(allData, outputFile);

        // Step 3: Upload to OneDrive
        // await uploadToOneDrive(outputFile);
    } catch (error) {
        console.error('Error:', error);
    }
})();