const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const { Client } = require('@microsoft/microsoft-graph-client');
const {google} = require('googleapis');
require('isomorphic-fetch');
const { executeCrawler } = require('./crawler');
const { executeGA4Api } = require('./ga4api');
const { parse } = require('path');


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

// Function to combine data
function combineData(crawlerData, ga4Data) {

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

    const rows = [];
    console.log('All the data are here: ', data );

    const parseDate = (rawDate) => {
        const year = rawDate.slice(0, 4);
        const month = rawDate.slice(4, 6);
        const day = rawDate.slice(6, 8);
        return `${day}.${month}.${year}`;
    };

    const firstEntryDate = data.length > 0 && data[0].reportData.length > 0 
        ? parseDate(data[0].reportData[0].date)// Format as dd.mm.yyyy
        : 'Unknown Date';

        rows.push([ firstEntryDate, '','', '', '', '']);
        rows.push([
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
    

    data.forEach(({ siteName, reportData,chartBeatPageviews, chartBeatuniques }) => {

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
             const cbpageviews = formatNumber(chartBeatPageviews);
             const cbuniques = formatNumber(chartBeatuniques);
             console.log("pageviews: ", cbpageviews," uniques: ",cbuniques);
            const engagementRate = (parseFloat(page.engagementRate) * 100).toFixed(2) + '%';
            rows.push([
                siteName,
                '',
                cbuniques,
                cbpageviews,
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