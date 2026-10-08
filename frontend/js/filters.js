/**
 * HandyNaija — Search & Location Filters Module
 */

import {
  NIGERIA_STATES,
  STATE_CITIES,
  NIGERIA_CITIES,
  getCitiesForState,
  getAllCapitals,
  populateStateSelect,
  populateCitySelect,
  bindStateAndCitySelects
} from './nigeria-states.js';

export {
  NIGERIA_STATES,
  STATE_CITIES,
  NIGERIA_CITIES,
  getCitiesForState,
  getAllCapitals,
  populateStateSelect,
  populateCitySelect,
  bindStateAndCitySelects
};

export function initFilters({ stateSelectId = 'filterStateSelect', citySelectId = 'filterCitySelect' } = {}) {
  const stateSelect = document.getElementById(stateSelectId);
  const citySelect = document.getElementById(citySelectId);

  if (stateSelect) {
    populateStateSelect(stateSelect, 'All Nigerian States');
    if (citySelect) {
      bindStateAndCitySelects(stateSelect, citySelect, true);
    }
  }
}

if (typeof window !== 'undefined') {
  window.HandyFilters = {
    init: initFilters,
    NIGERIA_STATES,
    STATE_CITIES,
    NIGERIA_CITIES,
    getCitiesForState,
    getAllCapitals,
    populateStateSelect,
    populateCitySelect,
    bindStateAndCitySelects
  };
}
