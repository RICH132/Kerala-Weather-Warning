import { normalizeMalayalam } from './malayalam-normalizer';
import { regexEducation, regexHoliday, REASON_KEYWORDS, INSTITUTION_MAPPING, GENERAL_INSTITUTION_KEYWORDS } from './keywords';

export interface AffectedInstitutions {
    schools: boolean;
    colleges: boolean;
    professionalColleges: boolean;
    anganwadis: boolean;
    madrasas: boolean;
    tuitionCenters: boolean;
    trainingInstitutes: boolean;
}

export interface ExtractionResult {
    district: string;
    declared: boolean;
    date: string | null;
    reason: string;
    postUrl: string;
    source: string;
    announcedAt: string;
    confidence: number;
    affectedInstitutions: AffectedInstitutions;
}

// Regex for Dates
// Standard DD/MM/YYYY or DD-MM-YYYY
const dateRegex1 = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/;
// Malayalam months and relative days
const relativeDaysRegex = /(നാളെ|ഇന്ന്|തിങ്കൾ|ചൊവ്വ|ബുധൻ|വ്യാഴം|വെള്ളി|ശനി|ഞായർ)/;
const malayalamMonthsRegex = /(ജനുവരി|ഫെബ്രുവരി|മാർച്ച്|ഏപ്രിൽ|മെയ്|ജൂൺ|ജൂലൈ|ഓഗസ്റ്റ്|ആഗസ്റ്റ്|സെപ്റ്റംബർ|ഒക്ടോബർ|നവംബർ|ഡിസംബർ)\s+(\d{1,2})/;

const getNextDayOfWeek = (dayName: string, referenceDate: Date): Date => {
    const days = ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'];
    const targetDay = days.indexOf(dayName);
    if (targetDay === -1) return referenceDate;
    
    const resultDate = new Date(referenceDate);
    resultDate.setDate(referenceDate.getDate() + (targetDay + 7 - referenceDate.getDay()) % 7);
    // If it's the same day, maybe they meant next week, but usually it's within a few days. We'll just return the next occurrence.
    if (targetDay === referenceDate.getDay()) {
        resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
};

const extractDate = (text: string, announcedAt: string): string | null => {
    const referenceDate = new Date(announcedAt);
    if (isNaN(referenceDate.getTime())) return null;

    const match1 = text.match(dateRegex1);
    if (match1) {
        // Assuming DD/MM/YYYY
        const [_, day, month, year] = match1;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`).toISOString();
    }

    const match2 = text.match(relativeDaysRegex);
    if (match2) {
        const word = match2[1];
        if (word === 'ഇന്ന്') {
            return referenceDate.toISOString();
        } else if (word === 'നാളെ') {
            const tmrw = new Date(referenceDate);
            tmrw.setDate(tmrw.getDate() + 1);
            return tmrw.toISOString();
        } else {
            return getNextDayOfWeek(word, referenceDate).toISOString();
        }
    }

    const match3 = text.match(malayalamMonthsRegex);
    if (match3) {
        const [_, monthStr, day] = match3;
        const months = ['ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മെയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'];
        let monthIdx = months.indexOf(monthStr);
        if (monthStr === 'ആഗസ്റ്റ്') monthIdx = 7; // August variant
        
        if (monthIdx !== -1) {
            const resultDate = new Date(referenceDate);
            resultDate.setMonth(monthIdx);
            resultDate.setDate(parseInt(day, 10));
            // Adjust year if month is earlier than current month (meaning next year)
            if (monthIdx < referenceDate.getMonth()) {
                resultDate.setFullYear(resultDate.getFullYear() + 1);
            }
            return resultDate.toISOString();
        }
    }

    return null;
};

const extractReason = (text: string): string => {
    for (const r of REASON_KEYWORDS) {
        if (r.keywords.some(kw => text.includes(kw))) {
            return r.reason;
        }
    }
    return 'Heavy Rain'; // Default
};

const extractInstitutions = (text: string): AffectedInstitutions => {
    const result: AffectedInstitutions = {
        schools: false,
        colleges: false,
        professionalColleges: false,
        anganwadis: false,
        madrasas: false,
        tuitionCenters: false,
        trainingInstitutes: false
    };

    const hasGeneral = GENERAL_INSTITUTION_KEYWORDS.some(kw => text.includes(kw));

    for (const inst of INSTITUTION_MAPPING) {
        if (inst.keywords.some(kw => text.includes(kw))) {
            (result as any)[inst.key] = true;
        }
    }

    if (hasGeneral) {
        result.schools = true;
        result.colleges = true;
        // Sometimes anganwadis and prof colleges are excluded even if general is used,
        // but we default them to true if the general keyword is broad enough, 
        // though typically we just set schools and colleges.
        result.professionalColleges = true;
        result.anganwadis = true;
        result.madrasas = true;
        result.tuitionCenters = true;
        result.trainingInstitutes = true;
    }

    return result;
};

export const extractHolidayInfo = (
    rawText: string, 
    district: string, 
    postUrl: string, 
    announcedAt: string
): ExtractionResult | null => {
    // Stage 1: Normalize
    const normalized = normalizeMalayalam(rawText);

    // Stage 2: Fast rejection
    if (!regexEducation.test(normalized)) {
        return null;
    }

    // Stage 3: Holiday detection
    if (!regexHoliday.test(normalized)) {
        return null;
    }

    // Stage 4: Extract structured information
    const date = extractDate(normalized, announcedAt);
    const reason = extractReason(normalized);
    const affectedInstitutions = extractInstitutions(normalized);

    return {
        district,
        declared: true,
        date,
        reason,
        postUrl,
        source: 'Facebook',
        announcedAt,
        confidence: 0.95, // Deterministic parsing confidence
        affectedInstitutions
    };
};
