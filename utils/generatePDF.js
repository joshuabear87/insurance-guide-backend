import puppeteer from 'puppeteer';

const generatePDF = async (url) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Optional: Set user agent to avoid blocks by some servers
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
    );

    // Go to the page and wait for it to fully load
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000, // 60 seconds max
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
    });

    return pdfBuffer;
  } catch (err) {
    console.error('❌ Failed to generate PDF with Puppeteer:', err.message);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default generatePDF;
