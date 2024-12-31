require('dotenv').config();
const puppeteer = require('puppeteer');


async function extractDataForSite(page, sitename) {
    // Construct the URL for the site
    const url = `https://chartbeat.com/publishing/historical/${sitename}/?show_landing=checked&sort=total_engaged_time`;
    
    // Go to the page and wait for the content to load
    await page.goto(url);
    await page.waitForNavigation();
    await page.waitForSelector('div[data-analytics-id="hd-summaryMetrics-Pageviews"] h3', { visible: true });
    
    // Extract data from the h3 elements
    const pageviewsText = await page.$eval('div[data-analytics-id="hd-summaryMetrics-Pageviews"] h3', (element) => {
        return element.textContent.trim();
    });

    const uniquesText = await page.$eval('div[data-analytics-id="hd-summaryMetrics-Uniques"] h3', (element) => {
        return element.textContent.trim();
    });

    return {
        sitename,
        chartBeatPageviews: pageviewsText,
        chartBeatuniques: uniquesText
    };
}

async function chartbeatLogIn(page) {
    await page.goto('https://chartbeat.com/signin/');

    await page.click('.osano-cm-close');

    // first login Step
    await page.type('#id_signin_form_email', process.env.CB_USERNAME);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // second login step
    await page.type('#id_signin_form_password', process.env.CB_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.screenshot({path: 'screenshot1.png'}); 

}

async function executeCrawler() {
    
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();

    const sitenames = [
        'athensmagazine.gr',
        'youweekly.gr',
        'travelstyle.gr'
    ];

    const results = [];

    await chartbeatLogIn(page);
    for (let sitename of sitenames) {
        console.log(`Extracting data for: ${sitename}`);

        // Extract the data for the current site
        const siteData = await extractDataForSite(page, sitename);
        
        // Store the results in the array
        results.push(siteData);

        console.log(`Data for ${sitename}:`, siteData);
    }

    console.log('All extracted data:', results);

    // url declaration
    // const url = `https://chartbeat.com/publishing/historical/${sitename}/?show_landing=checked&sort=total_engaged_time`;
    // await page.goto(url);
    // await page.waitForNavigation();
    // await page.waitForSelector('div[data-analytics-id="hd-summaryMetrics-Pageviews"] h3', { visible: true });
    // await page.screenshot({path: 'screenshot.png'});
    // // Extract data from the h3 element inside the div
    // const pageviewsText = await page.$eval('div[data-analytics-id="hd-summaryMetrics-Pageviews"] h3', (element) => {
    //     return element.textContent.trim(); // Extract and clean the text content
    // });

    // console.log('Pageviews:', pageviewsText); // Print the extracted text
    // const uniquesText = await page.$eval('div[data-analytics-id="hd-summaryMetrics-Uniques"] h3', (element) => {
    //     return element.textContent.trim(); // Extract and clean the text content
    // });

    // console.log('Uniques:', uniquesText); // Print the extracted text
    // await browser.close();

    await browser.close();
    return results;
}

// start();

module.exports = { executeCrawler };