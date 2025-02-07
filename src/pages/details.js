const { startBrowser } = require('../utils/browser');

async function scrapeCarDetails(url) {
    const browser = await startBrowser();
    const page = await browser.newPage();

    try {
        console.log(`🚗 Переходим к ${url}`);

        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 90000,
        });

        console.log('📄 Загружаем данные...');

        await page.waitForSelector('[data-testid="listing-price"]', { timeout: 30000 });

        const title = await page.$eval('[data-testid="listing-sub-heading"]', el => el.innerText.trim());
        const make = await page.$eval('[data-testid="listing-sub-heading"]', el => el.innerText.split(" ")[0].trim());
        const model = await page.$eval('[data-testid="listing-sub-heading"]', el => el.innerText.split(" ")[1].trim());
        const year = await page.$eval('[data-testid="listing-year-value"]', el => el.innerText.trim());
        const bodyType = await page.$eval('[data-testid="overview-body_type-value"]', el => el.innerText.trim());
        const horsepower = await page.$eval('[data-testid="overview-horsepower-value"]', el => el.innerText.trim());
        const fuelType = await page.$eval('[data-testid="overview-fuel_type-value"]', el => el.innerText.trim());
        const motorsTrim = await page.$eval('[data-testid="overview-fuel_type-value"]', el => el.innerText.trim());
        const kilometers = await page.$eval('[data-testid="listing-kilometers-value"]', el => el.innerText.trim().replace(/\D/g, ''));
        const exteriorColor = await page.$eval('[data-testid="overview-exterior_color-value"]', el => el.innerText.trim());
        const location = await page.$eval('[data-testid="listing-location-map"]', el => el.innerText.trim());

        const priceFormatted = await page.$eval('[data-testid="listing-price"] span', el => el.innerText.trim().replace("AED", "").trim());
        const priceRaw = parseFloat(priceFormatted.replace(/,/g, ''));
        const currency = "AED";

        const shortUrl = url;

        // 🔹 Кликаем по первому `.MuiImageListItem-standard`
        const mainImageSelector = '.MuiImageListItem-standard';
        await page.waitForSelector(mainImageSelector, { timeout: 10000 });

        let clicked = false;
        for (let attempt = 0; attempt < 3; attempt++) { // 3 попытки клика
            console.log(`📸 Попытка клика #${attempt + 1}...`);

            const mainImage = await page.$(mainImageSelector);
            if (!mainImage) {
                console.warn('⚠️ Главное изображение исчезло, пробуем заново...');
                await page.waitForTimeout(1000);
                continue;
            }

            try {
                await mainImage.hover();
                await page.waitForTimeout(500);
                await mainImage.click({ delay: 200 });
                clicked = true;
                break;
            } catch (error) {
                console.warn('⚠️ Элемент изменился, пробуем снова...');
                await page.waitForTimeout(1000);
            }
        }

        if (!clicked) {
            throw new Error('🚨 Не удалось кликнуть на главное изображение!');
        }

        console.log('📸 Кликнули, ждем загрузки модалки...');

        // 🔹 Ждем появления модального окна
        await page.waitForSelector('.MuiModal-root', { timeout: 15000 });

        // 🔹 Проверяем, загрузились ли изображения в модалке
        await page.waitForFunction(() => {
            const modal = document.querySelector('.MuiModal-root');
            return modal && modal.querySelectorAll('.MuiImageList-root img').length > 0;
        }, { timeout: 45000 });

        // 🔹 Собираем изображения
        const photos = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.MuiModal-root .MuiImageList-root img'))
                .map(img => img.src)
                .filter(src => src.includes('.jpeg') || src.includes('.jpg') || src.includes('.png'));
        });

        console.log(`📸 Собрано изображений: ${photos.length}`);

            // 🔹 Кликаем по кнопке "Call"
            const callButtonSelector = '[data-testid="call-cta-button"]';
            const callButton = await page.$(callButtonSelector);
            let phoneNumber = null;
            let sellerInfo = null;
    
            if (callButton) {
                console.log('📞 Кликаем на кнопку вызова...');
                await callButton.click();
                await page.waitForSelector('.MuiDialog-container', { timeout: 10000 });
    
                await page.waitForFunction(() => {
                    const modal = document.querySelector('.MuiDialog-container');
                    return modal && modal.querySelector('[data-testid="phone-number"]');
                }, { timeout: 15000 });
    
                // 🔹 Извлекаем номер телефона и данные продавца
                phoneNumber = await page.$eval('[data-testid="phone-number"]', el => el.innerText.trim());
                sellerInfo = await page.evaluate(() => {
                    const sellerElement = document.querySelector('.MuiTypography-body1.mui-style-1esa4yn');
                    return sellerElement ? sellerElement.innerText.trim() : null;
                });
    
                console.log(`📞 Получен номер телефона: ${phoneNumber}`);
                console.log(`👤 Информация о продавце: ${sellerInfo}`);
    
                // 🔹 Закрываем модальное окно
                const closeButton = await page.$('[data-testid="close-button"]');
                if (closeButton) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                }
            } else {
                console.warn('⚠️ Кнопка вызова не найдена, пропускаем...');
            }

        const carDetails = {
            short_url: shortUrl,
            title,
            photos,
            make,
            model,
            year,
            body_type: bodyType,
            horsepower,
            fuel_type: fuelType,
            motors_trim: motorsTrim,
            kilometers,
            price: {
                formatted: priceFormatted,
                raw: priceRaw,
                currency,
            },
            exterior_color: exteriorColor,
            location,
            contact: {
                phone: phoneNumber || 'Не указан',
                seller: sellerInfo || 'Не указан',
            },
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