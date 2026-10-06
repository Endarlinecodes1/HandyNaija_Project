/**
 * HandyNaija — Service Requests & Lifecycle Module
 * Version 1.0 (MVP Frontend Foundation)
 * Manages request creation, lifecycle status machine, progress timeline, and tracking.
 */

(function (window) {
  'use strict';

  let selectedProviderForRequest = null;

  const HandyRequests = {
    init: function () {
      this.initRequestForm();
      this.renderCustomerRequests();
      this.renderProviderJobs();
    },

    openRequestModal: function (providerId = null) {
      selectedProviderForRequest = providerId;
      const provider = providerId && window.HandyAPI ? window.HandyAPI.getProviderById(providerId) : null;
      
      const modal = document.getElementById('createRequestModal');
      const providerBanner = document.getElementById('requestModalProviderBanner');
      const serviceSelect = document.getElementById('requestServiceCategory');
      
      if (provider && providerBanner) {
        providerBanner.style.display = 'flex';
        providerBanner.innerHTML = `
          <div class="provider-avatar" style="width: 40px; height: 40px;">
            <img src="${provider.avatar}" alt="${provider.name}">
          </div>
          <div>
            <div style="font-size: var(--font-size-sm); font-weight: 700;">Requesting: ${provider.name}</div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">📍 ${provider.city}, ${provider.state} • Base rate: ${provider.startingRate}</div>
          </div>
        `;
        if (serviceSelect) serviceSelect.value = provider.category;
      } else if (providerBanner) {
        providerBanner.style.display = 'none';
      }

      if (window.HandyMain) window.HandyMain.openModal('createRequestModal');
    },

    initRequestForm: function () {
      const form = document.getElementById('createServiceRequestForm');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const serviceSelect = document.getElementById('requestServiceCategory');
        const descInput = document.getElementById('requestDescription');
        const stateSelect = document.getElementById('requestState');
        const cityInput = document.getElementById('requestCity');
        const areaInput = document.getElementById('requestArea');
        const dateInput = document.getElementById('requestDate');
        const timeInput = document.getElementById('requestTime');

        if (!descInput.value.trim()) {
          if (window.HandyMain) window.HandyMain.showToast('Please describe the problem you need help with.', 'warning');
          descInput.focus();
          return;
        }

        const provider = selectedProviderForRequest ? window.HandyAPI.getProviderById(selectedProviderForRequest) : null;

        const newRequest = window.HandyAPI.createRequest({
          serviceName: serviceSelect.options[serviceSelect.selectedIndex].text || 'General Service',
          category: serviceSelect.value,
          providerId: provider ? provider.id : 'prov-001',
          providerName: provider ? provider.name : 'Verified HandyNaija Pro',
          customerId: 'cust-101',
          customerName: 'Chris Okonkwo',
          customerPhone: '+234 803 123 4567',
          state: stateSelect.value || 'Anambra',
          city: cityInput.value.trim() || 'Awka',
          area: areaInput.value.trim() || 'Ifite',
          description: descInput.value.trim(),
          date: dateInput.value || 'Saturday',
          time: timeInput.value || '10:00 AM'
        });

        form.reset();
        selectedProviderForRequest = null;
        if (window.HandyMain) {
          window.HandyMain.closeModal('createRequestModal');
          window.HandyMain.showToast(`Service Request #${newRequest.id} created successfully!`, 'success');
        }

        this.renderCustomerRequests();
        this.renderProviderJobs();
        this.showRequestDetails(newRequest.id);
      });
    },

    renderCustomerRequests: function (containerSelector = '#customerRequestsList') {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const requests = window.HandyAPI ? window.HandyAPI.getRequests() : [];

      if (!requests || requests.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No service requests yet. Start by finding a trusted provider!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = requests.map(req => `
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-3); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1);">
              <span style="font-weight: 700; font-size: var(--font-size-sm);">${req.serviceName}</span>
              <span class="status-badge ${req.status}">${req.status}</span>
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
              Provider: <strong>${req.providerName}</strong> • ID: ${req.id} • 📍 ${req.location}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px;">
              Scheduled: ${req.preferredDate}
            </div>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-secondary btn-sm" onclick="HandyRequests.showRequestDetails('${req.id}')">View Details</button>
            <button class="btn btn-outline btn-sm" onclick="HandyMessages.openForRequest('${req.id}')">💬 Message</button>
          </div>
        </div>
      `).join('');
    },

    renderProviderJobs: function (containerSelector = '#providerJobsList') {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const requests = window.HandyAPI ? window.HandyAPI.getRequests() : [];

      if (!requests || requests.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No incoming service jobs.</p></div>`;
        return;
      }

      container.innerHTML = requests.map(req => `
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-3); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1);">
              <span style="font-weight: 700; font-size: var(--font-size-sm);">${req.serviceName}</span>
              <span class="status-badge ${req.status}">${req.status}</span>
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
              Customer: <strong>${req.customerName}</strong> (${req.customerPhone}) • 📍 ${req.location}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px;">
              Timing: ${req.preferredDate}
            </div>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            ${req.status === 'pending' ? `
              <button class="btn btn-primary btn-sm" onclick="HandyRequests.changeStatus('${req.id}', 'accepted')">Accept Job</button>
              <button class="btn btn-destructive btn-sm" onclick="HandyRequests.changeStatus('${req.id}', 'rejected')">Decline</button>
            ` : req.status === 'accepted' ? `
              <button class="btn btn-primary btn-sm" onclick="HandyRequests.changeStatus('${req.id}', 'inprogress')">Mark In Progress</button>
            ` : req.status === 'inprogress' ? `
              <button class="btn btn-primary btn-sm" style="background-color: var(--color-success);" onclick="HandyRequests.changeStatus('${req.id}', 'completed')">Mark Completed</button>
            ` : `
              <span style="font-size: var(--font-size-xs); color: var(--color-text-muted); padding: var(--space-1);">Job Concluded</span>
            `}
            <button class="btn btn-secondary btn-sm" onclick="HandyRequests.showRequestDetails('${req.id}')">View</button>
          </div>
        </div>
      `).join('');
    },

    changeStatus: function (requestId, newStatus) {
      const updated = window.HandyAPI.updateRequestStatus(requestId, newStatus);
      if (updated) {
        if (window.HandyMain) {
          window.HandyMain.showToast(`Request #${requestId} updated to "${newStatus.toUpperCase()}"`, 'info');
        }
        this.renderCustomerRequests();
        this.renderProviderJobs();
        this.showRequestDetails(requestId);
      }
    },

    showRequestDetails: function (requestId) {
      const requests = window.HandyAPI.getRequests();
      const req = requests.find(r => r.id === requestId);
      if (!req) return;

      const detailsModal = document.getElementById('requestDetailsModal');
      const detailsBody = document.getElementById('requestDetailsBody');
      if (!detailsModal || !detailsBody) return;

      const steps = ['Submitted', 'Accepted', 'Scheduled', 'In Progress', 'Completed'];
      const statusMap = { pending: 0, accepted: 1, scheduled: 2, inprogress: 3, completed: 4, rejected: 0, cancelled: 0 };
      const currentIdx = statusMap[req.status] || 0;

      detailsBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4);">
          <div>
            <h3 style="font-size: var(--font-size-lg); margin-bottom: 2px;">${req.serviceName}</h3>
            <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Request Reference: ${req.id}</span>
          </div>
          <span class="status-badge ${req.status}">${req.status}</span>
        </div>

        <!-- Lifecycle Progress Timeline -->
        <div class="timeline">
          ${steps.map((label, idx) => {
            const isDone = idx < currentIdx;
            const isActive = idx === currentIdx;
            return `
              <div class="timeline-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}">
                <div class="timeline-dot">${idx + 1}</div>
                <div class="timeline-label">${label}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin: var(--space-4) 0; font-size: var(--font-size-sm);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-3);">
            <div><strong>Provider:</strong> ${req.providerName}</div>
            <div><strong>Customer:</strong> ${req.customerName}</div>
            <div><strong>Location:</strong> ${req.location}</div>
            <div><strong>Scheduled Time:</strong> ${req.preferredDate}</div>
          </div>
          <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-2); margin-top: var(--space-2);">
            <strong>Problem Description:</strong>
            <p style="margin-top: 4px; font-size: var(--font-size-xs); color: var(--color-text-secondary);">${req.description}</p>
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-4);">
          <button class="btn btn-secondary btn-sm" onclick="HandyMessages.openForRequest('${req.id}')">💬 Message Provider</button>
          ${req.status === 'pending' || req.status === 'accepted' ? `
            <button class="btn btn-destructive btn-sm" onclick="HandyRequests.changeStatus('${req.id}', 'cancelled')">Cancel Request</button>
          ` : ''}
        </div>
      `;

      if (window.HandyMain) window.HandyMain.openModal('requestDetailsModal');
    }
  };

  window.HandyRequests = HandyRequests;
})(window);
