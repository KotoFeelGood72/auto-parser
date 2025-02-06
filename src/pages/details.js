const { startBrowser } = require('../utils/browser');

async function scrapeCarDetails(url) {
    const browser = await startBrowser();
    const page = await browser.newPage();

    try {
        console.log(`🚗 Переходим к ${url}`);

        // Устанавливаем заголовки для маскировки
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        // Увеличиваем таймаут и ждем загрузки DOM
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 90000,
        });

        console.log('📄 Загружаем данные...');

        // Ждём, пока появится цена (чтобы убедиться, что страница загрузилась)
        await page.waitForSelector('[data-testid="listing-price"]', { timeout: 30000 });

        // Парсим данные
        const title = await page.$eval('[data-testid="listing-sub-heading"]', el => el.innerText.trim());
        // const make = await page.$eval('[data-testid="listing-sub-heading"]', el => el.innerText.split(" ")[0].trim());
        // const model = await page.$eval('[data-testid="listing-sub-heading"]', el => el.innerText.split(" ")[1].trim());
        // const year = await page.$eval('[data-testid="listing-year-value"]', el => el.innerText.trim());
        // const bodyType = await page.$eval('[data-testid="listing-regional_specs-value"]', el => el.innerText.trim());
        // const horsepower = 'Unknown'; // Нужно найти подходящий селектор
        // const fuelType = await page.$eval('[data-testid="listing-regional_specs-value"]', el => el.innerText.includes('Electric') ? 'Electric' : 'Petrol/Diesel');
        // const kilometers = await page.$eval('[data-testid="listing-kilometers-value"]', el => el.innerText.trim().replace(/\D/g, ''));
        // const exteriorColor = 'Unknown'; // Нужно найти селектор
        // const location = await page.$eval('.MuiBox-root.mui-style-16dxzu1', el => el.innerText.trim());

        const priceFormatted = await page.$eval('[data-testid="listing-price"] span', el => el.innerText.trim().replace("AED", "").trim());
        const priceRaw = parseFloat(priceFormatted.replace(/,/g, ''));
        const currency = "AED";

        // Короткая ссылка (можно сформировать свою, если есть)
        const shortUrl = url;

        // Парсим изображения
        // const photos = await page.$$eval('.MuiBox-root img', imgs => imgs.map(img => img.src));

        const carDetails = {
            // short_url: shortUrl,
            title,
            // photos,
            // make,
            // model,
            // year,
            // generation: "", // Не найден селектор
            // body_type: bodyType,
            // horsepower,
            // fuel_type: fuelType,
            // motors_trim: "Sport", // Пока захардкожено, если найдем - обновим
            // kilometers,
            price: {
                formatted: priceFormatted,
                raw: priceRaw,
                currency,
            },
            // exterior_color: exteriorColor,
            // location,
        };

        console.log(carDetails);
        return carDetails;
    } catch (error) {
        console.error(`❌ Ошибка при загрузке данных с ${url}:`, error);
        return null;
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeCarDetails };