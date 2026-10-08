/**
 * HandyNaija — Nigeria States & Cities Single Source of Truth
 * Complete list of 36 Nigerian States + FCT Abuja (37 Total) in alphabetical order
 */

export const NIGERIA_STATES = [
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Anambra State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
  "Cross River State",
  "Delta State",
  "Ebonyi State",
  "Edo State",
  "Ekiti State",
  "Enugu State",
  "Abuja (FCT)",
  "Gombe State",
  "Imo State",
  "Jigawa State",
  "Kaduna State",
  "Kano State",
  "Katsina State",
  "Kebbi State",
  "Kogi State",
  "Kwara State",
  "Lagos State",
  "Nasarawa State",
  "Niger State",
  "Ogun State",
  "Ondo State",
  "Osun State",
  "Oyo State",
  "Plateau State",
  "Rivers State",
  "Sokoto State",
  "Taraba State",
  "Yobe State",
  "Zamfara State"
];

// All 36 State Capitals + FCT Abuja (37 total) in alphabetical order
export const NIGERIA_CAPITALS = [
  "Abakaliki",
  "Abeokuta",
  "Abuja (FCT)",
  "Ado-Ekiti",
  "Akure",
  "Asaba",
  "Awka",
  "Bauchi",
  "Benin City",
  "Birnin Kebbi",
  "Calabar",
  "Damaturu",
  "Dutse",
  "Enugu",
  "Gombe",
  "Gusau",
  "Ibadan",
  "Ikeja",
  "Ilorin",
  "Jalingo",
  "Jos",
  "Kaduna",
  "Kano",
  "Katsina",
  "Lafia",
  "Lokoja",
  "Maiduguri",
  "Makurdi",
  "Minna",
  "Osogbo",
  "Owerri",
  "Port Harcourt",
  "Sokoto",
  "Umuahia",
  "Uyo",
  "Yenagoa",
  "Yola"
];

export const STATE_CITIES = {
  "Abia State": ["Umuahia", "Aba", "Ohafia"],
  "Adamawa State": ["Yola", "Jimeta", "Mubi"],
  "Akwa Ibom State": ["Uyo", "Ikot Ekpene", "Eket"],
  "Anambra State": ["Awka", "Onitsha", "Nnewi"],
  "Bauchi State": ["Bauchi", "Azare", "Misau"],
  "Bayelsa State": ["Yenagoa", "Brass", "Ogbia"],
  "Benue State": ["Makurdi", "Gboko", "Otukpo"],
  "Borno State": ["Maiduguri", "Biu", "Bama"],
  "Cross River State": ["Calabar", "Ikom", "Ogoja"],
  "Delta State": ["Asaba", "Warri", "Sapele", "Ughelli"],
  "Ebonyi State": ["Abakaliki", "Afikpo", "Onueke"],
  "Edo State": ["Benin City", "Auchi", "Ekpoma"],
  "Ekiti State": ["Ado-Ekiti", "Ikere", "Ise"],
  "Enugu State": ["Enugu", "Nsukka", "Oji River"],
  "Abuja (FCT)": ["Abuja", "Gwagwalada", "Kuje", "Bwari"],
  "Gombe State": ["Gombe", "Bajoga", "Kaltungo"],
  "Imo State": ["Owerri", "Orlu", "Okigwe"],
  "Jigawa State": ["Dutse", "Hadejia", "Gumel"],
  "Kaduna State": ["Kaduna", "Zaria", "Kafanchan"],
  "Kano State": ["Kano", "Wudil", "Gaya"],
  "Katsina State": ["Katsina", "Daura", "Funtua"],
  "Kebbi State": ["Birnin Kebbi", "Argungu", "Yauri"],
  "Kogi State": ["Lokoja", "Okene", "Idah"],
  "Kwara State": ["Ilorin", "Offa", "Jebba"],
  "Lagos State": ["Ikeja", "Lekki", "Ikorodu", "Epe", "Badagry", "Surulere", "Yaba"],
  "Nasarawa State": ["Lafia", "Keffi", "Karu"],
  "Niger State": ["Minna", "Bida", "Suleja"],
  "Ogun State": ["Abeokuta", "Ijebu-Ode", "Sagamu", "Ota"],
  "Ondo State": ["Akure", "Ondo Town", "Owo"],
  "Osun State": ["Osogbo", "Ile-Ife", "Ilesa"],
  "Oyo State": ["Ibadan", "Oyo Town", "Ogbomoso"],
  "Plateau State": ["Jos", "Bukuru", "Shendam"],
  "Rivers State": ["Port Harcourt", "Obio-Akpor", "Bonny"],
  "Sokoto State": ["Sokoto", "Tambuwal", "Gwadabawa"],
  "Taraba State": ["Jalingo", "Wukari", "Bali"],
  "Yobe State": ["Damaturu", "Potiskum", "Nguru"],
  "Zamfara State": ["Gusau", "Kaura Namoda", "Talata Mafara"]
};

// Backwards compatibility alias
export const NIGERIA_CITIES = STATE_CITIES;

/**
 * Normalizes state name for matching and lookup
 * @param {string} stateName
 * @returns {string}
 */
export function normalizeStateName(stateName) {
  if (!stateName) return '';
  return stateName.replace(/\s+State$/i, '').trim().toLowerCase();
}

/**
 * Returns all state capitals / primary cities across Nigeria (all 37) in alphabetical order
 * @returns {string[]}
 */
export function getAllCapitals() {
  return [...NIGERIA_CAPITALS];
}

/**
 * Returns cities for a given Nigerian State
 * @param {string} stateName
 * @returns {string[]}
 */
export function getCitiesForState(stateName) {
  if (!stateName || stateName === 'all' || stateName === 'All States' || stateName === 'All Nigerian States') {
    return getAllCapitals();
  }
  if (STATE_CITIES[stateName]) return STATE_CITIES[stateName];
  
  const withState = stateName.endsWith(' State') ? stateName : stateName + ' State';
  if (STATE_CITIES[withState]) return STATE_CITIES[withState];

  const norm = normalizeStateName(stateName);
  for (const key of Object.keys(STATE_CITIES)) {
    if (normalizeStateName(key) === norm) {
      return STATE_CITIES[key];
    }
  }
  return ["Central Area", "Township", "GRA"];
}

/**
 * Dynamically populates a select element with complete 36 states + FCT (37 total)
 * @param {HTMLSelectElement|string} selectOrId
 * @param {string} defaultOptionLabel - e.g. "All Nigerian States" or "Select State"
 * @param {string} selectedValue
 */
export function populateStateSelect(selectOrId, defaultOptionLabel = 'All Nigerian States', selectedValue = '') {
  const select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId;
  if (!select) return;

  const uniqueStates = Array.from(new Set(NIGERIA_STATES));
  const options = [];

  if (defaultOptionLabel !== null) {
    const isFilter = defaultOptionLabel.toLowerCase().includes('all');
    const defaultVal = isFilter ? 'all' : '';
    options.push(`<option value="${defaultVal}">${defaultOptionLabel}</option>`);
  }

  const normSelected = normalizeStateName(selectedValue);

  uniqueStates.forEach(s => {
    const normS = normalizeStateName(s);
    const isSelected = normSelected && (normSelected === normS || selectedValue === s);
    options.push(`<option value="${s}"${isSelected ? ' selected' : ''}>${s}</option>`);
  });

  select.innerHTML = options.join('');
}

/**
 * Populates a City select element based on selected State
 * Logic:
 * - If state is empty (""): disable city with placeholder "Select State first"
 * - If state is "all" / "All Nigerian States" / "All States": enable city with "All Cities" + all 37 capital cities
 * - If specific state selected: populate with STATE_CITIES[state]
 * 
 * @param {HTMLSelectElement|string} citySelectOrId
 * @param {string} stateValue
 * @param {boolean} isFilterMode - If true, adds 'All Cities' (value 'all'). If false, adds 'Select City' (value '')
 * @param {string} selectedCity
 */
export function populateCitySelect(citySelectOrId, stateValue = 'all', isFilterMode = true, selectedCity = '') {
  const citySelect = typeof citySelectOrId === 'string' ? document.getElementById(citySelectOrId) : citySelectOrId;
  if (!citySelect) return;

  // 1. No state selected (empty)
  if (!stateValue || stateValue === '') {
    citySelect.disabled = true;
    citySelect.innerHTML = '<option value="">Select State first</option>';
    return;
  }

  // Enable city select
  citySelect.disabled = false;

  // 2. "All States" / "All Nigerian States" / "all"
  if (stateValue === 'all' || stateValue === 'All States' || stateValue === 'All Nigerian States') {
    const capitals = getAllCapitals();
    let optionsHtml = isFilterMode ? '<option value="all">All Cities (Capital Cities)</option>' : '<option value="">Select City / Capital</option>';
    capitals.forEach(c => {
      const isSelected = selectedCity && (selectedCity.toLowerCase() === c.toLowerCase());
      optionsHtml += `<option value="${c}"${isSelected ? ' selected' : ''}>${c}</option>`;
    });
    citySelect.innerHTML = optionsHtml;
    return;
  }

  // 3. Specific State Selected
  const cities = getCitiesForState(stateValue);
  let optionsHtml = isFilterMode ? '<option value="all">All Cities</option>' : '<option value="">Select City / Town</option>';
  cities.forEach(c => {
    const isSelected = selectedCity && (selectedCity.toLowerCase() === c.toLowerCase());
    optionsHtml += `<option value="${c}"${isSelected ? ' selected' : ''}>${c}</option>`;
  });
  citySelect.innerHTML = optionsHtml;
}

/**
 * Binds stateSelect change event to update citySelect automatically
 * @param {HTMLSelectElement|string} stateSelectOrId
 * @param {HTMLSelectElement|string} citySelectOrId
 * @param {boolean} isFilterMode
 */
export function bindStateAndCitySelects(stateSelectOrId, citySelectOrId, isFilterMode = true) {
  const stateSelect = typeof stateSelectOrId === 'string' ? document.getElementById(stateSelectOrId) : stateSelectOrId;
  const citySelect = typeof citySelectOrId === 'string' ? document.getElementById(citySelectOrId) : citySelectOrId;

  if (!stateSelect || !citySelect) return;

  // Initial population
  populateCitySelect(citySelect, stateSelect.value || 'all', isFilterMode);

  // Bind change event
  stateSelect.addEventListener('change', () => {
    populateCitySelect(citySelect, stateSelect.value, isFilterMode);
  });
}

/**
 * Automatically populates all known state and city selects in the DOM
 */
export function populateAllStateSelects() {
  const stateSelectors = [
    '#heroStateSelect',
    '#filterStateSelect',
    '#filter-state',
    '#state',
    '#custState',
    '#provState',
    '#setupState',
    '#profileState',
    '#requestState',
    '#formState',
    '#regCustStateInput',
    '#regProvStateSelect',
    'select[data-populate="states"]'
  ];

  stateSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(sel => {
      const isFilter = sel.id.includes('filter') || sel.id.includes('hero') || sel.getAttribute('data-populate') === 'states';
      const defaultLabel = isFilter ? 'All States (Nigeria)' : 'Select State';
      const curVal = sel.value;
      populateStateSelect(sel, defaultLabel, curVal);
    });
  });

  // Automatically wire paired city selects if found
  const pairs = [
    { state: '#heroStateSelect', city: '#heroCitySelect', isFilter: true },
    { state: '#filterStateSelect', city: '#filterCitySelect', isFilter: true },
    { state: '#state', city: '#custCitySelect', isFilter: false },
    { state: '#custState', city: '#custCitySelect', isFilter: false },
    { state: '#regProvStateSelect', city: '#regProvCitySelect', isFilter: false },
    { state: '#requestState', city: '#requestCitySelect', isFilter: false }
  ];

  pairs.forEach(pair => {
    const stEl = document.querySelector(pair.state);
    const ctEl = document.querySelector(pair.city);
    if (stEl && ctEl) {
      bindStateAndCitySelects(stEl, ctEl, pair.isFilter);
    }
  });

  // Also ensure any unpaired city selects showing "all" get all capitals
  document.querySelectorAll('select[data-populate="cities"]').forEach(ctEl => {
    const stEl = ctEl.closest('form')?.querySelector('select[data-populate="states"]');
    const stVal = stEl ? stEl.value : 'all';
    populateCitySelect(ctEl, stVal, true);
  });
}

// Global browser window attachment
if (typeof window !== 'undefined') {
  window.NIGERIA_STATES = NIGERIA_STATES;
  window.NIGERIA_CAPITALS = NIGERIA_CAPITALS;
  window.STATE_CITIES = STATE_CITIES;
  window.NIGERIA_CITIES = STATE_CITIES;
  window.normalizeStateName = normalizeStateName;
  window.getAllCapitals = getAllCapitals;
  window.getCitiesForState = getCitiesForState;
  window.populateStateSelect = populateStateSelect;
  window.populateCitySelect = populateCitySelect;
  window.bindStateAndCitySelects = bindStateAndCitySelects;
  window.populateAllStateSelects = populateAllStateSelects;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateAllStateSelects);
  } else {
    populateAllStateSelects();
  }
}
