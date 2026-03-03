import axios from 'axios';
import puppeteer from 'puppeteer';

/**
 * Make HTTP request through BrightData proxy
 */
export async function brightdataProxyRequest(options) {
  const { url, method = 'GET', headers = {}, body = '', timeout = 30000 } = options;
  
  // Get proxy configuration from environment variables
  const proxyHost = process.env.BRIGHTDATA_HOST || 'brd.superproxy.io';
  const proxyPort = process.env.BRIGHTDATA_PORT || '22225';
  const proxyUsername = process.env.BRIGHTDATA_USERNAME;
  const proxyPassword = process.env.BRIGHTDATA_PASSWORD;
  
  if (!proxyUsername || !proxyPassword) {
    throw new Error('BrightData credentials not configured. Please set BRIGHTDATA_USERNAME and BRIGHTDATA_PASSWORD environment variables.');
  }
  
  const proxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`;
  
  try {
    const config = {
      method: method.toLowerCase(),
      url,
      proxy: {
        host: proxyHost,
        port: parseInt(proxyPort),
        auth: {
          username: proxyUsername,
          password: proxyPassword,
        },
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...headers,
      },
      timeout,
    };
    
    if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = body;
    }
    
    const response = await axios(config);
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    };
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(`Proxy request failed: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(`Proxy request failed: No response received - ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Proxy request failed: ${error.message}`);
    }
  }
}

/**
 * Scrape webpage using BrightData proxy with Puppeteer
 */
export async function scrapeWithBrightData(options) {
  const { url, selector = '', waitFor = '', timeout = 30000 } = options;
  
  // Get proxy configuration from environment variables
  const proxyHost = process.env.BRIGHTDATA_HOST || 'brd.superproxy.io';
  const proxyPort = process.env.BRIGHTDATA_PORT || '22225';
  const proxyUsername = process.env.BRIGHTDATA_USERNAME;
  const proxyPassword = process.env.BRIGHTDATA_PASSWORD;
  
  if (!proxyUsername || !proxyPassword) {
    throw new Error('BrightData credentials not configured. Please set BRIGHTDATA_USERNAME and BRIGHTDATA_PASSWORD environment variables.');
  }
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${proxyHost}:${proxyPort}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });
    
    const page = await browser.newPage();
    
    // Set proxy authentication
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword,
    });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout 
    });
    
    // Wait for specific element if provided
    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout });
    }
    
    // Extract content
    let content;
    
    if (selector) {
      // Extract specific element content
      const element = await page.$(selector);
      if (element) {
        content = await page.evaluate(el => el.textContent, element);
      } else {
        throw new Error(`Element not found with selector: ${selector}`);
      }
    } else {
      // Extract entire page content
      content = await page.evaluate(() => document.body.innerText);
    }
    
    // Also get page metadata
    const metadata = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }));
    
    return {
      success: true,
      content: content.trim(),
      metadata,
      selector: selector || 'full_page',
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url,
      selector: selector || 'full_page',
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Test proxy connection
 */
export async function testProxyConnection() {
  try {
    const response = await brightdataProxyRequest({
      url: 'https://httpbin.org/ip',
      method: 'GET',
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Proxy connection successful',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Proxy connection failed',
    };
  }
}

/**
 * Get available proxy zones (mock implementation)
 * In a real implementation, this would call BrightData API
 */
export async function getProxyZones() {
  // Mock data - in real implementation, call BrightData API
  const zones = [
    {
      name: 'residential',
      description: 'Residential IP addresses',
      type: 'rotating',
    },
    {
      name: 'datacenter',
      description: 'Data center IP addresses',
      type: 'static',
    },
    {
      name: 'mobile',
      description: 'Mobile IP addresses',
      type: 'rotating',
    },
  ];
  
  return {
    success: true,
    zones,
  };
}

/**
 * Configure proxy settings
 */
export function getProxyConfig() {
  return {
    host: process.env.BRIGHTDATA_HOST || 'brd.superproxy.io',
    port: process.env.BRIGHTDATA_PORT || '22225',
    username: process.env.BRIGHTDATA_USERNAME,
    password: process.env.BRIGHTDATA_PASSWORD ? '***configured***' : null,
    configured: !!(process.env.BRIGHTDATA_USERNAME && process.env.BRIGHTDATA_PASSWORD),
  };
}