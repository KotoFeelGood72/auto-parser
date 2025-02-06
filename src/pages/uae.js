const { startBrowser } = require('../utils/browser');

async function scrapeList() {
    const browser = await startBrowser();
    const page = await browser.newPage();
    
    await page.goto('https://example.com');
    await page.waitForSelector('h1');

    const title = await page.$eval('h1', el => el.innerText);
    console.log(`Заголовок страницы: ${title}`);

    await browser.close();
}

module.exports = { scrapeList };