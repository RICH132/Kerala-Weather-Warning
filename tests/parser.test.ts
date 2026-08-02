import { test, describe } from 'node:test';
import assert from 'node:assert';
import { normalizeMalayalam } from '../src/parser/malayalam-normalizer';
import { extractHolidayInfo } from '../src/parser/extractor';

describe('Collector Holiday Monitor Parser', () => {
    test('Normalizer collapses whitespace and normalizes text', () => {
        const raw = 'നാളെ    അവധി   പ്രഖ്യാപിച്ചു \u200C'; // contains ZWNJ
        const normalized = normalizeMalayalam(raw);
        assert.strictEqual(normalized, 'നാളെ അവധി പ്രഖ്യാപിച്ചു');
    });

    test('Extracts simple holiday post correctly', () => {
        const text = 'എറണാകുളം ജില്ലയിലെ എല്ലാ വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾക്കും നാളെ അവധി പ്രഖ്യാപിച്ചു. കനത്ത മഴ തുടരുന്ന സാഹചര്യത്തിലാണ് നടപടി.';
        const result = extractHolidayInfo(text, 'Ernakulam', 'http://fb', '2026-08-02T10:00:00.000Z');
        
        assert.ok(result);
        assert.strictEqual(result?.declared, true);
        assert.strictEqual(result?.reason, 'Heavy Rain');
        // 'നാളെ' relative to 2026-08-02 is 2026-08-03
        assert.strictEqual(result?.date?.split('T')[0], '2026-08-03');
        assert.strictEqual(result?.affectedInstitutions.schools, true);
        assert.strictEqual(result?.affectedInstitutions.colleges, true);
    });

    test('Rejects weather warnings without holiday/education keywords', () => {
        const text = 'എറണാകുളം ജില്ലയിൽ റെഡ് അലർട്ട് പ്രഖ്യാപിച്ചു. എല്ലാവരും ജാഗ്രത പാലിക്കുക. ദുരിതാശ്വാസ ക്യാമ്പ് തുറന്നു.';
        const result = extractHolidayInfo(text, 'Ernakulam', 'http://fb', '2026-08-02T10:00:00.000Z');
        assert.strictEqual(result, null);
    });

    test('Rejects non-education holiday (like public holiday but not for schools explicitly)', () => {
        // Technically if it just says 'holiday' without education keywords, it gets rejected.
        const text = 'നാളെ ഓണം പ്രമാണിച്ച് ജില്ലയിൽ അവധി പ്രഖ്യാപിച്ചു.';
        const result = extractHolidayInfo(text, 'Ernakulam', 'http://fb', '2026-08-02T10:00:00.000Z');
        assert.strictEqual(result, null); // no education keywords
    });

    test('Extracts exact date and specific institutions', () => {
        const text = 'അംഗനവാടികൾക്കും ട്യൂഷൻ സെന്ററുകൾക്കും 03/08/2026 ന് അവധിയായിരിക്കും. ശക്തമായ കാറ്റ് കാരണമാണ് ഇത്.';
        const result = extractHolidayInfo(text, 'Trivandrum', 'http://fb', '2026-08-01T10:00:00.000Z');
        
        assert.ok(result);
        assert.strictEqual(result?.reason, 'Strong Wind');
        assert.strictEqual(result?.date?.split('T')[0], '2026-08-03');
        assert.strictEqual(result?.affectedInstitutions.anganwadis, true);
        assert.strictEqual(result?.affectedInstitutions.tuitionCenters, true);
        assert.strictEqual(result?.affectedInstitutions.schools, false);
    });
});
