const { startBrowser } = require('../utils/browser');

async function scrapeListings() {
    const browser = await startBrowser();
    const page = await browser.newPage();

    try {
        console.log('🔍 Открываем страницу списка объявлений...');
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        await page.goto('https://uae.dubizzle.com/motors/used-cars/', {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        console.log('📄 Собираем ссылки на объявления...');
        await page.waitForSelector('[data-testid^="listing-"]', { timeout: 30000 });

        // 🛠️ Фиксим ошибку: собираем href правильно
        const links = await page.$$eval('[data-testid^="listing-"]', elements =>
            elements.map(el => el.getAttribute('href')).filter(href => href !== null)
        );

        // Добавляем полный URL
        const fullLinks = links.map(link => `https://uae.dubizzle.com${link}`);

        console.log(`✅ Найдено ${fullLinks.length} объявлений`);
        return fullLinks;
    } catch (error) {
        console.error('❌ Ошибка при парсинге списка объявлений:', error);
        return [];
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeListings };