const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const { Client } = require('@microsoft/microsoft-graph-client');
const {google} = require('googleapis');
require('isomorphic-fetch');
const { executeCrawler } = require('./crawler');
const { executeGA4Api } = require('./ga4api');
const { parse } = require('path');

// Replace with your credentials
// const CHARTBEAT_API_KEY = 'YOUR_CHARTBEAT_API_KEY';
// const SITE_HOST = 'yourwebsite.com'; // e.g., example.com
// const ONE_DRIVE_FOLDER_ID = 'YOUR_ONEDRIVE_FOLDER_ID'; // Replace with your OneDrive folder ID
// const ACCESS_TOKEN = 'YOUR_MICROSOFT_GRAPH_ACCESS_TOKEN'; // Replace with a valid access token

// const PROPERTIES = [
//     {id : '269754074', name: 'www.athensmagazine.gr'},
//     {id: '275364433', name: 'www.youweekly.gr'},
//     {id: '311944538', name:'www.travelstyle.gr'},
// ];

// const KEY_FILE_PATH = 'Quickstart-3330b5de2e63.json';


// Initialize the Google Analytics Data API client
// async function initializeAnalytics() {
//     const auth = new google.auth.GoogleAuth({
//         keyFile: KEY_FILE_PATH,
//         scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
//     });

//     return google.analyticsdata({
//         version: 'v1beta',
//         auth,
//     });

// }


// async function fetchReport(analyticsData,propertyId) {
//             const request = {
//                 property: `properties/${propertyId}`,
//                 requestBody: {
//                     dimensions: [
//                         {name: 'date'},
//                     ],
//                     metrics: [
//                         {name: 'totalUsers'},
//                         {name: 'screenPageViews'},
//                         {name: 'screenPageViewsPerUser'},
//                         {name: 'engagementRate'},
//                         {name: 'userEngagementDuration'},
//                         {name: "activeUsers"},
//                         // {name: 'averageEngagementTime'},
//                     ],
//                     dateRanges: [
//                         {startDate: 'yesterday', endDate: 'yesterday'}, // Example date range
//                     ],
//                 },
//             };

//             try {
//                 const response = await analyticsData.properties.runReport(request);
//                 const rows = response.data.rows || [];
//                 return rows.map(row => {
//                     const userEngagementDuration = parseFloat(row.metricValues[4].value); // Convert to float
//                     const activeUsers = parseInt(row.metricValues[5].value, 10); // Convert to integer
//                     const avgEngagementTimePerUser = activeUsers > 0
//                         ? userEngagementDuration / activeUsers
//                         : 0; // Avoid division by zero
        
//                     return {
//                         date: row.dimensionValues[0].value,
//                         users: row.metricValues[0].value,
//                         pageviews: row.metricValues[1].value,
//                         viewsperuser: parseFloat(row.metricValues[2].value).toFixed(2),
//                         engagementRate: parseFloat(row.metricValues[3].value).toFixed(2),
//                         userEngagementDuration: row.metricValues[4].value,
//                         activeUsers: row.metricValues[5].value,
//                         averageEngagementTimePerUser: avgEngagementTimePerUser.toFixed(2), // Format to 2 decimal places
//                     };
//                 });
//             } catch (error) {
//                 console.error(`Error fetching report for property ${propertyId}:`, error);
//                 return []; // Return an empty array if the request fails
//             }
// }


// Generate an Excel file
// function generateExcel(data, outputFile) {
//     const rows = [];

//     const parseDate = (rawDate) => {
//         const year = rawDate.slice(0, 4);
//         const month = rawDate.slice(4, 6) - 1; // Month is zero-based
//         const day = rawDate.slice(6, 8);
//         return `${day}.${month}.${year}`;; // Format as dd.mm.yyyy
//     };
//     // Dynamically extract the date from the first entry in the report data
//     const firstEntryDate = data.length > 0 && data[0].reportData.length > 0 
//         ? parseDate(data[0].reportData[0].date)// Format as dd.mm.yyyy
//         : 'Unknown Date';

//         rows.push([ firstEntryDate, '','', '', '', '']);
//         rows.push([
//             // firstEntryDate,
//             'Site',
//             // 'Date',
//             'Total Users (GA4)', 
//             'Views (GA4)',
//             'Views per user',
//             'Engagement rate', 
//             'Average engagement time'
//         ]); // Header row
    
//     // Add the date row (above site data)
//     // rows.push([firstEntryDate, '', '', '', '', '', '']); // Empty cells after the date

//     data.forEach(({ siteName, reportData }) => {
//         // Add a row for the property ID
//         // rows.push([ siteName , '', '', '', '', '']);

//         // Add the report data for this property
//         reportData.forEach(page => {
//             console.log('Raw date value:', page.date);
//             const avgEngagementTimeSec = parseFloat(page.averageEngagementTimePerUser);
//             const minutes = Math.floor(avgEngagementTimeSec / 60);
//             const seconds = Math.round(avgEngagementTimeSec % 60);
//             const formattedTime = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
//             // to make "," "."
//             const formatNumber = (num) => {
//                 return num.toLocaleString('en-GB').replace(/,/g, '.');
//             };

//              // Format numeric values
//              const totalUsers = formatNumber(parseFloat(page.users));
//              const pageviews = formatNumber(parseFloat(page.pageviews));
//              const viewsPerUser = formatNumber(parseFloat(page.viewsperuser));
//             //  const engagementRate = parseFloat(page.engagementRate).toLocaleString('en-US');
//             const engagementRate = (parseFloat(page.engagementRate) * 100).toFixed(2) + '%';
//             rows.push([
//                 siteName,
//                 totalUsers,
//                 pageviews,
//                 viewsPerUser,
//                 engagementRate,
//                 formattedTime,
//             ]);
//         });
//     });

//     const worksheet = xlsx.utils.aoa_to_sheet(rows);
//     // Set column widths
//     worksheet['!cols'] = [
//         { wch: 25 }, // 'Site' column
//         { wch: 15 }, // 'Date' column
//         { wch: 12 }, // 'Total Users' column
//         { wch: 15 }, // 'Pageviews' column
//         { wch: 15 }, // 'Views per user' column
//         { wch: 20 }, // 'Engagement rate' column
//         { wch: 35 }, // 'Average engagement time' column
//     ];
//     const workbook = xlsx.utils.book_new();
//     xlsx.utils.book_append_sheet(workbook, worksheet, 'Analytics');

//     xlsx.writeFile(workbook, outputFile);
//     console.log(`Excel file generated: ${outputFile}`);
// }

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
// (async function () {
//     const outputFile = 'AnalyticsReport.xlsx';

//     try {
//         // Step 1: Fetch pageviews
//         const analyticsData = await initializeAnalytics();
//         const allData = [];

//         for (const {id, name} of PROPERTIES) {
//             console.log(`Fetching data for ${name} Property ID: ${id}`);
//             const reportData = await fetchReport(analyticsData, id);
//             allData.push({ propertyId:id,siteName: name, reportData });
//         }
//         generateExcel(allData, outputFile);

//         // Step 3: Upload to OneDrive
//         // await uploadToOneDrive(outputFile);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// })();

async function main() {
    try {
        // Step 1: Execute crawler and fetch Chartbeat data
        const crawlerData = await executeCrawler();
        console.log("Crawler data fetched:", crawlerData);

        // Step 2: Execute GA4 API and fetch analytics data
        const ga4Data = await executeGA4Api();
        console.log("GA4 data fetched:", ga4Data);

        // Step 3: Combine data from both sources
        const combinedData = combineData(crawlerData, ga4Data);

        // Step 4: Generate the Excel file based on combined data
        const outputFile = 'AnalyticsReport.xlsx';
        generateExcel(combinedData, outputFile);

        console.log(`Excel file generated at ${outputFile}`);
    } catch (error) {
        console.error("Error in the main flow:", error);
    }
}

// Function to combine data (e.g., merge or manipulate as needed)
function combineData(crawlerData, ga4Data) {
    // Here you can combine both datasets based on your needs.
    // For example, assuming crawlerData and ga4Data are arrays of objects:
    return crawlerData.map((crawlerEntry, index) => {
        const ga4Entry = ga4Data[index] || {};  // Default to an empty object if no match
        return {
            ...crawlerEntry,
            ...ga4Entry,
        };
    });
}

// Function to generate Excel file from data
function generateExcel(data, outputFile) {
    // const rows = [];
    // rows.push(['Site', 'Views (Chartbeat)', 'Total users (Chartbeat)', 'Total Users (GA4)', 'Pageviews (GA4)', 'Engagement Rate (GA4)']);  // Header row

    // data.forEach(item => {
    //     rows.push([item.siteName, item.pageviews, item.uniques, item.users, item.pageviewsGA4, item.engagementRateGA4]);
    // });

    // const worksheet = xlsx.utils.aoa_to_sheet(rows);
    // const workbook = xlsx.utils.book_new();
    // xlsx.utils.book_append_sheet(workbook, worksheet, 'Analytics');
    // xlsx.writeFile(workbook, outputFile);
    const rows = [];
    console.log('All the data are here: ', data );

    const parseDate = (rawDate) => {
        const year = rawDate.slice(0, 4);
        const month = rawDate.slice(4, 6) - 1; // Month is zero-based
        const day = rawDate.slice(6, 8);
        return `${day}.${month}.${year}`;; // Format as dd.mm.yyyy
    };
    // Dynamically extract the date from the first entry in the report data
    const firstEntryDate = data.length > 0 && data[0].reportData.length > 0 
        ? parseDate(data[0].reportData[0].date)// Format as dd.mm.yyyy
        : 'Unknown Date';

        rows.push([ firstEntryDate, '','', '', '', '']);
        rows.push([
            // firstEntryDate,
            'Site',
            'Adsense Revenue',
            'Total users (chartbeat)',
            'Views (chartbeat)',
            'Total Users (GA4)', 
            'Views (GA4)',
            'Views per user',
            'Engagement rate', 
            'Average engagement time'
        ]); // Header row
    
    // Add the date row (above site data)
    // rows.push([firstEntryDate, '', '', '', '', '', '']); // Empty cells after the date

    data.forEach(({ siteName, reportData,chartBeatPageviews, chartBeatuniques }) => {
        // Add a row for the property ID
        // rows.push([ siteName , '', '', '', '', '']);

        // Add the report data for this property
        reportData.forEach(page => {
            console.log('Raw date value:', page.date);
            const avgEngagementTimeSec = parseFloat(page.averageEngagementTimePerUser);
            const minutes = Math.floor(avgEngagementTimeSec / 60);
            const seconds = Math.round(avgEngagementTimeSec % 60);
            const formattedTime = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
            // to make "," "."
            const formatNumber = (num) => {
                return num.toLocaleString('en-GB').replace(/,/g, '.');
            };

             // Format numeric values
             const totalUsers = formatNumber(parseFloat(page.users));
             const pageviews = formatNumber(parseFloat(page.pageviews));
             const viewsPerUser = formatNumber(parseFloat(page.viewsperuser));
            //  const cbpageviews = formatNumber(parseFloat(chartBeatPageviews));
            //  const cbuniques = formatNumber(parseFloat(chartBeatuniques));
             const cbpageviews = formatNumber(chartBeatPageviews);
             const cbuniques = formatNumber(chartBeatuniques);
             console.log("pageviews: ", cbpageviews," uniques: ",cbuniques);
            //  const engagementRate = parseFloat(page.engagementRate).toLocaleString('en-US');
            const engagementRate = (parseFloat(page.engagementRate) * 100).toFixed(2) + '%';
            rows.push([
                siteName,
                '',
                cbpageviews,
                cbuniques,
                totalUsers,
                pageviews,
                viewsPerUser,
                engagementRate,
                formattedTime,
            ]);
        });
    });

    const worksheet = xlsx.utils.aoa_to_sheet(rows);
    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // 'Site' column
        { wch: 25 }, // 'Adsense' column
        { wch: 25 }, // 'cbpageviews' column
        { wch: 15 }, // 'cbuniques' column
        { wch: 12 }, // 'Total Users' column
        { wch: 15 }, // 'Pageviews' column
        { wch: 15 }, // 'Views per user' column
        { wch: 20 }, // 'Engagement rate' column
        { wch: 35 }, // 'Average engagement time' column
    ];
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Analytics');

    xlsx.writeFile(workbook, outputFile);
    console.log(`Excel file generated: ${outputFile}`);
}

main();  // Trigger the main function