import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const STATE_FILE = path.join(__dirname, '..', '..', 'state.json');
const RESULTS_FILE = path.join(__dirname, '..', '..', 'public', 'holidays.json');

export interface AppState {
    lastProcessedPosts: Record<string, string>; // district -> postUrl
}

export const loadState = (): AppState => {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        logger.error('Failed to load state', e);
    }
    return { lastProcessedPosts: {} };
};

export const saveState = (state: AppState) => {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        logger.error('Failed to save state', e);
    }
};

export const saveResults = (results: any[]) => {
    try {
        const outputData = {
            lastUpdated: new Date().toISOString(),
            holidays: results
        };
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(outputData, null, 2));
        logger.info(`Results saved to ${RESULTS_FILE}`);
    } catch (e) {
        logger.error('Failed to save results', e);
    }
};
