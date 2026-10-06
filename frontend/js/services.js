/**
 * HandyNaija — Services & Categories Module
 * Version 1.0 (MVP Frontend Foundation)
 * Manages service categories, icon mapping, and category UI rendering.
 */

(function (window) {
  'use strict';

  const HandyServices = {
    init: function () {
      this.renderCategoryGrid();
      this.populateCategorySelects();
    },

    getCategories: function () {
      return window.HandyAPI ? window.HandyAPI.getServices() : [];
    },

    renderCategoryGrid: function (containerSelector = '#categoriesGrid') {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const categories = this.getCategories();
      if (!categories || categories.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No service categories available.</p></div>`;
        return;
      }

      container.innerHTML = categories.map(cat => `
        <a href="#providersSection" class="category-card" data-category="${cat.slug}">
          <div class="category-icon-wrapper">
            <img src="${cat.icon}" alt="${cat.name}" width="32" height="32" loading="lazy">
          </div>
          <div class="category-info">
            <h4>${cat.name}</h4>
            <span>${cat.providerCount} Verified Pros</span>
          </div>
        </a>
      `).join('');

      // Add click handlers for category cards
      container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const categorySlug = card.getAttribute('data-category');
          if (window.HandyProviders && window.HandyProviders.filterByCategory) {
            window.HandyProviders.filterByCategory(categorySlug);
          }
        });
      });
    },

    populateCategorySelects: function () {
      const selects = document.querySelectorAll('select[data-populate="services"]');
      const categories = this.getCategories();

      selects.forEach(select => {
        const includeAll = select.getAttribute('data-include-all') !== 'false';
        let options = includeAll ? `<option value="all">All Service Categories</option>` : `<option value="" disabled selected>Select a Service</option>`;
        
        options += categories.map(c => `
          <option value="${c.slug}">${c.name}</option>
        `).join('');

        select.innerHTML = options;
      });
    }
  };

  window.HandyServices = HandyServices;
})(window);
