import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';
import { loadState, saveState, saveResults, AppState } from './state/storage';
import { extractHolidayInfo, ExtractionResult } from './parser/extractor';

const COLLECTORS_FILE = path.join(__dirname, '..', 'collectors.json');

interface CollectorConfig {
    district: string;
    facebookUrl: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loadCollectors = (): CollectorConfig[] => {
    try {
        const data = fs.readFileSync(COLLECTORS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        logger.error('Failed to load collectors.json', e);
        return [];
    }
};

const extractPostsFromPage = async (page: Page): Promise<string[]> => {
    // Wait a bit for posts to render
    await page.waitForTimeout(3000);
    
    // Facebook DOM changes frequently. role="article" is often used for posts.
    // We will extract text from all such elements.
    const postsText = await page.evaluate(() => {
        const articles = Array.from(document.querySelectorAll('div[role="article"]'));
        if (articles.length > 0) {
            return articles.map(el => el.textContent || '');
        }
        // Fallback if role="article" isn't present
        const dirAuto = Array.from(document.querySelectorAll('div[dir="auto"]'));
        // Group by chunks or just return all dir="auto" with substantial length
        return dirAuto.map(el => el.textContent || '').filter(t => t.length > 20);
    });

    return postsText;
};

const processDistrict = async (
    browser: Browser,
    collector: CollectorConfig,
    state: AppState
): Promise<ExtractionResult[]> => {
    let page: Page | null = null;
    let retries = 3;
    let delay = 2000;
    const results: ExtractionResult[] = [];

    while (retries > 0) {
        try {
            logger.info(`Navigating to ${collector.district} Facebook page...`);
            page = await browser.newPage();
            // Go to Facebook page, with network idle to ensure content loads
            await page.goto(collector.facebookUrl, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Try closing the login popup if it exists
            try {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
            } catch (e) {
                // Ignore popup closing errors
            }

            const posts = await extractPostsFromPage(page);
            logger.info(`Found ${posts.length} text blocks on ${collector.district} page.`);

            const announcedAt = new Date().toISOString();
            
            for (const post of posts) {
                if (!post || post.trim().length === 0) continue;
                
                // Using a hash of the post content to identify it (since we don't have exact permalinks easily)
                const postId = Buffer.from(post.substring(0, 100)).toString('base64');
                const lastProcessed = state.lastProcessedPosts[collector.district];

                if (lastProcessed === postId) {
                    logger.info(`Already processed latest posts for ${collector.district}. Stopping post scan.`);
                    break;
                }

                const extraction = extractHolidayInfo(post, collector.district, collector.facebookUrl, announcedAt);
                if (extraction) {
                    logger.info(`🎉 Holiday found for ${collector.district}! Reason: ${extraction.reason}`);
                    results.push(extraction);
                    // Update state with the most recent matched post ID (assuming chronological order)
                    state.lastProcessedPosts[collector.district] = postId;
                    // Usually we only want the first match per run per district
                    break;
                }
            }
            
            // Break out of retry loop on success
            break; 
        } catch (error) {
            logger.error(`Error processing ${collector.district}. Retries left: ${retries - 1}`, error);
            retries--;
            if (retries > 0) {
                logger.info(`Waiting ${delay}ms before retrying...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff
            }
        } finally {
            if (page) await page.close();
        }
    }

    return results;
};

export const runMonitor = async () => {
    logger.info('Starting Collector Holiday Monitor...');
    const collectors = loadCollectors();
    if (collectors.length === 0) {
        logger.warn('No collectors configured. Exiting.');
        return;
    }

    const state = loadState();
    const allResults: ExtractionResult[] = [];
    
    logger.info('Launching Playwright browser...');
    const browser = await chromium.launch({ headless: true });

    try {
        for (const collector of collectors) {
            const districtResults = await processDistrict(browser, collector, state);
            allResults.push(...districtResults);
        }

        saveState(state);
        
        if (allResults.length > 0) {
            saveResults(allResults);
            // Here you could plug in an external notification system
            logger.info(`Monitor finished. Found ${allResults.length} new holiday announcements.`);
        } else {
            logger.info('Monitor finished. No new holidays found.');
        }

    } catch (error) {
        logger.error('Fatal error during monitor run', error);
    } finally {
        await browser.close();
        logger.info('Browser closed.');
    }
};

// If run directly
if (require.main === module) {
    runMonitor();
}
