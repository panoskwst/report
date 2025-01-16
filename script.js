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
        // const outputFile = 'Y:\\INTERNET\\PROGRAMMATIC\\ADSENSE\\AdSenseReport_DAILY_2025.xlsx';
        // const outputFile = 'test\\AdSenseReport_DAILY_2025.xlsx';
        const outputFile = 'Z:\\__PORTAL\\WEB\\Reports\\AdSenseReport_DAILY_2025.xlsx';
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
    const parseDate = (rawDate) => {
        const year = rawDate.slice(0, 4);
        const month = rawDate.slice(4, 6);
        const day = rawDate.slice(6, 8);
        return `${day}.${month}.${year}`;
    };

    let workbook;
    let worksheet;
    let existingRows = [];

    if (fs.existsSync(outputFile)) {
        workbook = xlsx.readFile(outputFile);
        worksheet = workbook.Sheets['Analytics'];

        // Parse existing rows
        existingRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    } else {
        // Create a new workbook and worksheet if the file doesn't exist
        workbook = xlsx.utils.book_new();
        worksheet = xlsx.utils.aoa_to_sheet([]);
        workbook.Sheets['Analytics'] = worksheet;
        workbook.SheetNames.push('Analytics');
    }

    const rows =existingRows.length === 0 ? [] : [...existingRows];

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
    
            // Initialize total counters
        let totalCbUniques = 0;
        let totalCbPageviews = 0;
        let totalGaUsers = 0;
        let totalGaPageviews = 0;

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
            const parseNumber = (num) => {
                if (typeof num === 'string') {
                    // Remove thousands separator dots
                    num = num.replace(/\./g, '');
                }
                return parseFloat(num) || 0; // Parse the cleaned string as a number
            };

             // Format numeric values
             const gaUsers = formatNumber(parseFloat(page.users));
             const pageviews = formatNumber(parseFloat(page.pageviews));
             const viewsPerUser = formatNumber(parseFloat(page.viewsperuser));
             const cbpageviews = formatNumber(chartBeatPageviews);
             const cbuniques = formatNumber(chartBeatuniques);
             console.log("pageviews: ", cbpageviews," uniques: ",cbuniques);
            const engagementRate = (parseFloat(page.engagementRate) * 100).toFixed(0) + '%';

            // Accumulate totals
            // totalCbUniques += parseFloat(chartBeatuniques);
            // totalCbPageviews += parseFloat(chartBeatPageviews);
            totalCbUniques += parseNumber(cbuniques);
            totalCbPageviews += parseNumber(cbpageviews);
            totalGaUsers += parseFloat(page.users);
            totalGaPageviews += parseFloat(page.pageviews);
            console.log(' totalCbUniques: ',totalCbUniques, ' totalCbPageviews:', totalCbPageviews, ' totalGaUsers: ', totalGaUsers, ' totalGaPageviews: ', totalGaPageviews);

            rows.push([
                siteName,
                '',
                cbuniques,
                cbpageviews,
                gaUsers,
                pageviews,
                viewsPerUser,
                engagementRate,
                formattedTime,
            ]);
        });
    });

    rows.push([
        'Total',
        '',
        totalCbUniques.toLocaleString('en-GB').replace(/,/g, '.'),
        totalCbPageviews.toLocaleString('en-GB').replace(/,/g, '.'),
        totalGaUsers.toLocaleString('en-GB').replace(/,/g, '.'),
        totalGaPageviews.toLocaleString('en-GB').replace(/,/g, '.'),
        '',
        '',
        ''
    ]);

    // worksheet = xlsx.utils.aoa_to_sheet(rows);

    const updatedWorksheet = xlsx.utils.aoa_to_sheet(rows);
        // Set column widths
        updatedWorksheet['!cols'] = [
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
    workbook.Sheets['Analytics'] = updatedWorksheet;

    xlsx.writeFile(workbook, outputFile);
    console.log(`Excel file generated: ${outputFile}`);
}

main();  // Trigger the main function