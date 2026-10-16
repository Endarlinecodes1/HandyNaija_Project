/**
 * HandyNaija — Service Providers Module
 * Version 1.0 (MVP Frontend Foundation)
 * Manages provider search, filters, cards rendering, and profile modals.
 */

(function (window) {
  'use strict';

  let currentFilters = {
    category: 'all',
    state: 'all',
    city: 'all',
    area: 'all',
    query: ''
  };

  const HandyProviders = {
    init: function () {
      this.initLocationSelectors();
      this.initSearchForms();
      this.renderProvidersList();
    },

    initLocationSelectors: function () {
      const states = (typeof window !== 'undefined' && window.NIGERIA_STATES) ? window.NIGERIA_STATES : [
        "Abia State","Adamawa State","Akwa Ibom State","Anambra State","Bauchi State","Bayelsa State","Benue State","Borno State","Cross River State","Delta State","Ebonyi State","Edo State","Ekiti State","Enugu State","Abuja (FCT)","Gombe State","Imo State","Jigawa State","Kaduna State","Kano State","Katsina State","Kebbi State","Kogi State","Kwara State","Lagos State","Nasarawa State","Niger State","Ogun State","Ondo State","Osun State","Oyo State","Plateau State","Rivers State","Sokoto State","Taraba State","Yobe State","Zamfara State"
      ];

      const stateSelects = document.querySelectorAll('select[data-populate="states"], #heroStateSelect, #filterStateSelect');
      const citySelects = document.querySelectorAll('select[data-populate="cities"], #heroCitySelect, #filterCitySelect');
      const areaSelects = document.querySelectorAll('select[data-populate="areas"]');

      stateSelects.forEach(stateSelect => {
        const isFilter = stateSelect.id.includes('filter') || stateSelect.id.includes('hero') || stateSelect.getAttribute('data-populate') === 'states';
        const defaultLabel = isFilter ? 'All States (Nigeria)' : 'Select State';
        const defaultVal = isFilter ? 'all' : '';
        const curVal = stateSelect.value || defaultVal;

        let stateOpts = `<option value="${defaultVal}">${defaultLabel}</option>`;
        states.forEach(st => {
          stateOpts += `<option value="${st}"${curVal === st ? ' selected' : ''}>${st}</option>`;
        });
        stateSelect.innerHTML = stateOpts;

        const updatePairedCities = (stVal) => {
          const form = stateSelect.closest('form') || document;
          const matchedCities = form.querySelectorAll('select[data-populate="cities"], #heroCitySelect, #filterCitySelect');
          const targetCities = matchedCities.length > 0 ? matchedCities : citySelects;

          targetCities.forEach(citySelect => {
            if (window.populateCitySelect) {
              window.populateCitySelect(citySelect, stVal, isFilter);
            } else {
              if (!stVal || stVal === '') {
                citySelect.disabled = true;
                citySelect.innerHTML = '<option value="">Select State first</option>';
              } else if (stVal === 'all' || stVal.includes('All')) {
                citySelect.disabled = false;
                const capitals = window.getAllCapitals ? window.getAllCapitals() : [
                  "Abakaliki","Abeokuta","Abuja (FCT)","Ado-Ekiti","Akure","Asaba","Awka","Bauchi","Benin City","Birnin Kebbi","Calabar","Damaturu","Dutse","Enugu","Gombe","Gusau","Ibadan","Ikeja","Ilorin","Jalingo","Jos","Kaduna","Kano","Katsina","Lafia","Lokoja","Maiduguri","Makurdi","Minna","Osogbo","Owerri","Port Harcourt","Sokoto","Umuahia","Uyo","Yenagoa","Yola"
                ];
                citySelect.innerHTML = '<option value="all">All Cities (Capital Cities)</option>' + capitals.map(c => `<option value="${c}">${c}</option>`).join('');
              } else {
                citySelect.disabled = false;
                const getCities = window.getCitiesForState || (s => (window.STATE_CITIES && window.STATE_CITIES[s]) || ['All Cities']);
                const cities = getCities(stVal);
                citySelect.innerHTML = '<option value="all">All Cities</option>' + cities.map(c => `<option value="${c}">${c}</option>`).join('');
              }
            }
          });
        };

        // Initialize cities on startup
        updatePairedCities(stateSelect.value);

        stateSelect.addEventListener('change', (e) => {
          const selectedState = e.target.value;
          currentFilters.state = selectedState;
          currentFilters.city = 'all';
          currentFilters.area = 'all';

          updatePairedCities(selectedState);

          areaSelects.forEach(areaSelect => {
            areaSelect.innerHTML = '<option value="all">All Areas / Neighborhoods</option>';
          });
        });
      });

      citySelects.forEach(citySelect => {
        citySelect.addEventListener('change', (e) => {
          currentFilters.city = e.target.value;
          currentFilters.area = 'all';
        });
      });

      areaSelects.forEach(areaSelect => {
        areaSelect.addEventListener('change', (e) => {
          currentFilters.area = e.target.value;
        });
      });
    },

    initSearchForms: function () {
      const searchForms = document.querySelectorAll('.provider-search-form, #heroSearchForm');

      const executeSearch = (form) => {
        const queryInput = form.querySelector('[name="searchQuery"], #heroSearchQuery');
        const serviceSelect = form.querySelector('[name="serviceCategory"], #heroServiceCategory');
        const stateSelect = form.querySelector('[name="state"], #heroStateSelect');
        const citySelect = form.querySelector('[name="city"], #heroCitySelect');
        const areaSelect = form.querySelector('[name="area"]');

        currentFilters.query = queryInput ? queryInput.value.trim() : '';
        currentFilters.category = serviceSelect ? serviceSelect.value : 'all';
        currentFilters.state = stateSelect ? stateSelect.value : 'all';
        currentFilters.city = citySelect ? citySelect.value : 'all';
        currentFilters.area = areaSelect ? areaSelect.value : 'all';

        // Provide button feedback if available
        const submitBtn = form.querySelector('button[type="submit"], #heroQuickSearchBtn');
        let originalContent = '';
        if (submitBtn) {
          originalContent = submitBtn.innerHTML;
          submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px; animation: spin 0.8s linear infinite;">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <span>Finding Pros...</span>
          `;
          submitBtn.disabled = true;
        }

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
          }

          this.renderProvidersList();

          // Smooth scroll to providers section
          const target = document.getElementById('providersSection');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      };

      searchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          executeSearch(form);
        });

        // Direct click listener on submit buttons as a fail-safe
        const btn = form.querySelector('button[type="submit"], #heroQuickSearchBtn');
        if (btn) {
          btn.addEventListener('click', (e) => {
            if (btn.getAttribute('type') !== 'submit') {
              e.preventDefault();
              executeSearch(form);
            }
          });
        }
      });
    },

    filterByCategory: function (categorySlug) {
      currentFilters.category = categorySlug;
      const serviceSelects = document.querySelectorAll('select[data-populate="services"], #heroServiceCategory');
      serviceSelects.forEach(sel => sel.value = categorySlug);
      this.renderProvidersList();
      const target = document.getElementById('providersSection');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    clearFilter: function (filterName) {
      if (filterName === 'query') {
        currentFilters.query = '';
        const qInput = document.getElementById('heroSearchQuery');
        if (qInput) qInput.value = '';
      } else if (filterName === 'category') {
        currentFilters.category = 'all';
        const cSelect = document.getElementById('heroServiceCategory');
        if (cSelect) cSelect.value = 'all';
      } else if (filterName === 'state') {
        currentFilters.state = 'all';
        currentFilters.city = 'all';
        const sSelect = document.getElementById('heroStateSelect');
        if (sSelect) sSelect.value = 'all';
      } else if (filterName === 'city') {
        currentFilters.city = 'all';
        const ctSelect = document.getElementById('heroCitySelect');
        if (ctSelect) ctSelect.value = 'all';
      }
      this.renderProvidersList();
    },

    renderProvidersList: function (containerSelector = '#providersGrid') {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const providers = window.HandyAPI ? window.HandyAPI.getProviders(currentFilters) : [];
      const filterTag = document.getElementById('activeFilterDisplay');
      const filterBar = document.getElementById('providersFilterBar');
      const activeChipsContainer = document.getElementById('providersActiveChips');
      const fullResultsLink = document.getElementById('providersFullResultsLink');

      const isFiltered = (currentFilters.query !== '') ||
        (currentFilters.category !== 'all') ||
        (currentFilters.state !== 'all') ||
        (currentFilters.city !== 'all' && !currentFilters.city.toLowerCase().includes('all')) ||
        (currentFilters.area !== 'all' && !currentFilters.area.toLowerCase().includes('all'));

      // Update Active Filter Display Text
      if (filterTag) {
        if (!isFiltered) {
          filterTag.textContent = `Showing all ${providers.length} verified providers across Nigeria`;
        } else {
          let parts = [];
          if (currentFilters.query) parts.push(`"${currentFilters.query}"`);
          if (currentFilters.category !== 'all') parts.push(currentFilters.category);
          if (currentFilters.state !== 'all') parts.push(currentFilters.state);
          if (currentFilters.city !== 'all' && !currentFilters.city.toLowerCase().includes('all')) parts.push(currentFilters.city);
          filterTag.textContent = `Found ${providers.length} verified provider${providers.length === 1 ? '' : 's'} for ${parts.join(' in ')}`;
        }
      }

      // Update Filter Bar and Chips
      if (filterBar) {
        if (isFiltered) {
          filterBar.style.display = 'flex';
          if (activeChipsContainer) {
            let chipsHtml = '';
            if (currentFilters.query) {
              chipsHtml += `<span class="service-chip service-chip-selected" style="background: var(--color-primary-light); color: var(--color-primary); font-weight: 600;">🔍 "${currentFilters.query}" <button type="button" class="chip-remove-btn" onclick="HandyProviders.clearFilter('query')" aria-label="Remove search term">&times;</button></span>`;
            }
            if (currentFilters.category !== 'all') {
              chipsHtml += `<span class="service-chip service-chip-selected" style="background: var(--color-primary-light); color: var(--color-primary); font-weight: 600;">🏷️ ${currentFilters.category} <button type="button" class="chip-remove-btn" onclick="HandyProviders.clearFilter('category')" aria-label="Remove category">&times;</button></span>`;
            }
            if (currentFilters.state !== 'all') {
              chipsHtml += `<span class="service-chip service-chip-selected" style="background: var(--color-primary-light); color: var(--color-primary); font-weight: 600;">📍 ${currentFilters.state} <button type="button" class="chip-remove-btn" onclick="HandyProviders.clearFilter('state')" aria-label="Remove state">&times;</button></span>`;
            }
            if (currentFilters.city !== 'all' && !currentFilters.city.toLowerCase().includes('all')) {
              chipsHtml += `<span class="service-chip service-chip-selected" style="background: var(--color-primary-light); color: var(--color-primary); font-weight: 600;">🏙️ ${currentFilters.city} <button type="button" class="chip-remove-btn" onclick="HandyProviders.clearFilter('city')" aria-label="Remove city">&times;</button></span>`;
            }
            activeChipsContainer.innerHTML = chipsHtml;
          }
          if (fullResultsLink) {
            const qs = new URLSearchParams({
              searchQuery: currentFilters.query || '',
              category: currentFilters.category || 'all',
              state: currentFilters.state || 'all',
              city: currentFilters.city || 'all'
            }).toString();
            fullResultsLink.href = `pages/search-results.html?${qs}`;
          }
        } else {
          filterBar.style.display = 'none';
        }
      }

      if (!providers || providers.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: var(--space-8); text-align: center; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-lg);">
            <div style="font-size: 3rem; margin-bottom: var(--space-3);">🔍</div>
            <h3 class="empty-state-title" style="margin-bottom: var(--space-2); font-size: var(--font-size-h3);">No Service Providers Found</h3>
            <p class="empty-state-text" style="max-width: 520px; margin: 0 auto var(--space-5); color: var(--color-text-secondary); line-height: 1.6;">
              We couldn't find any verified professionals matching your search. Try removing specific keywords, broadening your location, or browsing by trade.
            </p>
            <div style="display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary" onclick="HandyProviders.resetFilters()">Show All Verified Providers</button>
              <a href="pages/search-results.html" class="btn btn-outline">Open Advanced Search Page</a>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = providers.map(p => `
        <article class="provider-card" data-id="${p.id}">
          <div class="provider-header">
            <div class="provider-avatar">
              <img src="${p.avatar}" alt="${p.name}" loading="lazy">
            </div>
            <div class="provider-meta">
              <div class="provider-title-row">
                <h3 class="provider-name">${p.name}</h3>
                ${p.isVerified ? `<span class="verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Verified</span>` : ''}
              </div>
              <div class="provider-subtitle">
                <span class="rating-badge"><span class="star-icon">★</span> ${p.rating} (${p.reviewCount})</span>
                <span>•</span>
                <span>${p.experienceYears} yrs exp</span>
                <span>•</span>
                <span>📍 ${p.city}, ${p.state}</span>
              </div>
            </div>
          </div>

          <p class="provider-bio">${p.bio}</p>

          <div class="provider-services-list">
            ${p.services.slice(0, 3).map(s => `<span class="service-chip">${s}</span>`).join('')}
            ${p.services.length > 3 ? `<span class="service-chip">+${p.services.length - 3} more</span>` : ''}
          </div>

          <div class="provider-footer">
            <button type="button" class="btn btn-secondary btn-sm" onclick="HandyProviders.showProfileModal('${p.id}')">View Profile</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="if(window.HandyRequests){HandyRequests.openRequestModal('${p.id}');}else if(window.HandyMain){HandyMain.openLoginModal();} return false;">Request Service</button>
          </div>
        </article>
      `).join('');
    },

    resetFilters: function () {
      currentFilters = { category: 'all', state: 'all', city: 'all', area: 'all', query: '' };
      const searchInputs = document.querySelectorAll('#heroSearchForm input, #heroSearchForm select, .provider-search-form input, .provider-search-form select');
      searchInputs.forEach(input => {
        if (input.tagName === 'SELECT') input.value = 'all';
        else input.value = '';
      });
      const qInput = document.getElementById('heroSearchQuery');
      if (qInput) qInput.value = '';
      this.renderProvidersList();
    },

    showProfileModal: function (providerId) {
      const provider = window.HandyAPI ? window.HandyAPI.getProviderById(providerId) : null;
      if (!provider) return;

      const modalBody = document.getElementById('providerModalBody');
      const modal = document.getElementById('providerDetailsModal');
      if (!modalBody || !modal) return;

      modalBody.innerHTML = `
        <div style="display: flex; gap: var(--space-4); align-items: center; margin-bottom: var(--space-5);">
          <div class="provider-avatar" style="width: 72px; height: 72px;">
            <img src="${provider.avatar}" alt="${provider.name}">
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <h2 style="font-size: var(--font-size-h2);">${provider.name}</h2>
              ${provider.isVerified ? `<span class="verified-badge">✓ Verified</span>` : ''}
            </div>
            <p style="margin: 0; font-size: var(--font-size-label); color: var(--color-text-secondary);">
              ${provider.categoryName} • ${provider.experienceYears} Years Experience
            </p>
            <div style="display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-1);">
              <span class="rating-badge"><span class="star-icon">★</span> ${provider.rating} (${provider.reviewCount} customer reviews)</span>
              <span>•</span>
              <span style="font-size: var(--font-size-caption); color: var(--color-primary); font-weight: 600;">📍 ${provider.area}, ${provider.city}, ${provider.state}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: var(--space-5);">
          <h4 style="font-size: var(--font-size-label); text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); margin-bottom: var(--space-2);">About Professional</h4>
          <p style="font-size: var(--font-size-label); line-height: 1.6;">${provider.bio}</p>
        </div>

        <div style="margin-bottom: var(--space-5);">
          <h4 style="font-size: var(--font-size-label); text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); margin-bottom: var(--space-2);">Offered Services</h4>
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
            ${provider.services.map(s => `<span class="service-chip" style="background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary-border); font-weight: 600;">${s}</span>`).join('')}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); background: var(--color-surface-muted); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-5); border: 1px solid var(--color-border);">
          <div>
            <div style="font-size: var(--font-size-caption); color: var(--color-text-secondary);">Starting Base Rate</div>
            <div style="font-size: var(--font-size-h3); font-weight: 700; color: var(--color-text-primary);">${provider.startingRate}</div>
          </div>
          <div>
            <div style="font-size: var(--font-size-caption); color: var(--color-text-secondary);">Standard Working Hours</div>
            <div style="font-size: var(--font-size-caption); font-weight: 600; color: var(--color-text-primary); margin-top: 4px;">${provider.availability}</div>
          </div>
        </div>

        <div style="margin-bottom: var(--space-2);">
          <h4 style="font-size: var(--font-size-label); text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); margin-bottom: var(--space-3);">Recent Customer Reviews</h4>
          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-2);">
            <div style="display: flex; justify-content: space-between; font-size: var(--font-size-caption); margin-bottom: 4px;">
              <strong>Emeka O. (Awka)</strong>
              <span class="rating-badge"><span class="star-icon">★</span> 5.0</span>
            </div>
            <p style="font-size: var(--font-size-caption); margin: 0; color: var(--color-text-secondary);">"Arrived on time, quickly diagnosed the plumbing leakage and fixed the issue cleanly. Highly recommended!"</p>
          </div>
        </div>
      `;

      const requestBtn = document.getElementById('providerModalRequestBtn');
      if (requestBtn) {
        requestBtn.onclick = (e) => {
          if (e) e.preventDefault();
          const inPagesDir = window.location.pathname.includes('/pages/');
          window.location.href = inPagesDir ? 'login.html' : 'pages/login.html';
        };
      }

      if (window.HandyMain) window.HandyMain.openModal('providerDetailsModal');
    }
  };

  window.HandyProviders = HandyProviders;
})(window);
