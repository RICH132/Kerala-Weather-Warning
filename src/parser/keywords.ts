export const EDUCATION_KEYWORDS = [
    'വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾ', // Educational institutions
    'സ്കൂൾ', 'സ്കൂളുകൾ', 'സ്കൂളുകൾക്ക്', // School, schools
    'കോളേജ്', 'കോളേജുകൾ', // College, colleges
    'അങ്കണവാടി', 'അംഗനവാടി', 'അംഗനവാടികൾ', // Anganwadi
    'പ്രൊഫഷണൽ കോളേജ്', 'പ്രൊഫഷണൽ കോളേജുകൾ', // Professional colleges
    'മദ്രസ', 'മദ്രസകൾ', // Madrasas
    'ട്യൂഷൻ', 'ട്യൂഷൻ സെൻ്ററുകൾ', // Tuition centers
    'പരിശീലന കേന്ദ്രങ്ങൾ', 'പരിശീലന കേന്ദ്രങ്ങൾക്ക്', // Training institutes
    'വിദ്യാഭ്യാസസ്ഥാപനങ്ങൾക്ക്'
];

export const HOLIDAY_KEYWORDS = [
    'അവധി', 'അവധിയായിരിക്കും', 'അവധി പ്രഖ്യാപിച്ചു', // Holiday, will be holiday, declared holiday
    'holiday', 'closed'
];

// False positives - if these exist BUT no education keywords, it's definitely false.
// If both exist, we need to ensure the holiday keyword actually applies to education.
// The spec says "Reject posts that only contain: Weather warning, Orange Alert, etc."
export const FALSE_POSITIVE_KEYWORDS = [
    'റെഡ് അലർട്ട്', 'red alert',
    'ഓറഞ്ച് അലർട്ട്', 'orange alert',
    'യെല്ലോ അലർട്ട്', 'മഞ്ഞ അലർട്ട്', 'yellow alert',
    'മഴ മുന്നറിയിപ്പ്', 'rainfall update',
    'ദുരന്ത നിവാരണ', 'disaster management',
    'ജാഗ്രതാ നിർദ്ദേശം', 'awareness', 'warning',
    'ദുരിതാശ്വാസ ക്യാമ്പ്', 'relief camp',
    'എമർജൻസി', 'emergency contact'
];

// Reasons mapping
export const REASON_KEYWORDS = [
    { keywords: ['കനത്ത മഴ', 'തീവ്രമായ മഴ', 'heavy rain', 'മഴ'], reason: 'Heavy Rain' },
    { keywords: ['പ്രതികൂല കാലാവസ്ഥ', 'adverse weather', 'മോശം കാലാവസ്ഥ'], reason: 'Adverse Weather' },
    { keywords: ['വെള്ളപ്പൊക്കം', 'flooding'], reason: 'Flooding' },
    { keywords: ['ശക്തമായ കാറ്റ്', 'strong wind', 'കാറ്റ്'], reason: 'Strong Wind' }
];

export const INSTITUTION_MAPPING = [
    { key: 'schools', keywords: ['സ്കൂൾ', 'സ്കൂളുകൾ', 'school'] },
    { key: 'colleges', keywords: ['കോളേജ്', 'കോളേജുകൾ', 'college'] },
    { key: 'professionalColleges', keywords: ['പ്രൊഫഷണൽ കോളേജ്', 'പ്രൊഫഷണൽ', 'professional'] },
    { key: 'anganwadis', keywords: ['അങ്കണവാടി', 'അംഗനവാടി', 'anganwadi'] },
    { key: 'madrasas', keywords: ['മദ്രസ', 'മദ്രസകൾ', 'madrasa'] },
    { key: 'tuitionCenters', keywords: ['ട്യൂഷൻ', 'tuition'] },
    { key: 'trainingInstitutes', keywords: ['പരിശീലന കേന്ദ്രങ്ങൾ', 'പരിശീലന'] }
];

// If 'വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾ' is mentioned, we usually assume all general institutions (schools, colleges).
export const GENERAL_INSTITUTION_KEYWORDS = ['വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾ', 'വിദ്യാഭ്യാസസ്ഥാപനങ്ങൾക്ക്', 'educational institutions'];

// Compiled Regexes for O(n) scanning
export const regexEducation = new RegExp(EDUCATION_KEYWORDS.join('|'), 'i');
export const regexHoliday = new RegExp(HOLIDAY_KEYWORDS.join('|'), 'i');

// False positive regex: matches if the text contains these but NOT education/holiday. 
// Handled in logic.
