const puppeteer = require('puppeteer');
const path = require('path');

async function convertToPNG() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Load the HTML file
    const filePath = path.join(__dirname, 'email-template-screenshot.html');
    await page.goto(`file://${filePath}`);
    
    // Set viewport to capture the email width
    await page.setViewport({ width: 850, height: 800 });
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Take screenshot of just the email content
    const element = await page.$('table[style*="width: 800px"]');
    await element.screenshot({ 
        path: 'email-template.png',
        omitBackground: true
    });
    
    await browser.close();
    console.log('Screenshot saved as email-template.png');
}

convertToPNG().catch(console.error);