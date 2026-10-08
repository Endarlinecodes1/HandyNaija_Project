/**
 * HandyNaija — Main Application Entry Point & Public Navigation System
 * Version 2.0 (Clean Public Marketplace State)
 * Orchestrates public header, keyboard-accessible mobile drawer, modals, toasts, tabs, and auth state.
 */

(function (window) {
  'use strict';

  // Complete list of 36 Nigerian States + FCT Abuja (37 total) in alphabetical order
  const NIGERIA_STATES = (typeof window !== 'undefined' && window.NIGERIA_STATES) ? window.NIGERIA_STATES : [
    "Abia State","Adamawa State","Akwa Ibom State","Anambra State","Bauchi State","Bayelsa State","Benue State","Borno State","Cross River State","Delta State","Ebonyi State","Edo State","Ekiti State","Enugu State","Abuja (FCT)","Gombe State","Imo State","Jigawa State","Kaduna State","Kano State","Katsina State","Kebbi State","Kogi State","Kwara State","Lagos State","Nasarawa State","Niger State","Ogun State","Ondo State","Osun State","Oyo State","Plateau State","Rivers State","Sokoto State","Taraba State","Yobe State","Zamfara State"
  ];
  window.NIGERIA_STATES = NIGERIA_STATES;

  const HandyMain = {
    init: function () {
      this.initMobileNav();
      this.initHeaderScroll();
      this.initModals();
      this.populateStateDropdown();
      this.initAuthForms();
      this.initDemoTabs();
      this.initReviewForm();
      this.initInteractiveChips();
      this.initContactForm();
      this.initHeroCarousel();

      // Initialize feature modules
      if (window.HandyServices) window.HandyServices.init();
      if (window.HandyProviders) window.HandyProviders.init();
      if (window.HandyRequests) window.HandyRequests.init();
      if (window.HandyMessages) window.HandyMessages.init();

      // Sync initial auth UI state (Guest by default)
      if (window.HandyAuth) {
        this.updateAuthUI(window.HandyAuth.getRole(), window.HandyAuth.getUser());
      }

      // Listen for auth changes
      window.addEventListener('handynaija:auth-change', (e) => {
        this.updateAuthUI(e.detail.role, e.detail.user);
      });

      console.log('HandyNaija Public Navigation & Frontend Foundation initialized successfully.');
    },

    /* ------------------------------------------------------------------------
       KEYBOARD-ACCESSIBLE MOBILE NAVIGATION DRAWER
       ------------------------------------------------------------------------ */
    initMobileNav: function () {
      const toggleBtn = document.getElementById('mobileMenuBtn');
      const drawer = document.getElementById('mobileNavDrawer');
      const overlay = document.getElementById('mobileDrawerOverlay');
      const closeBtn = document.getElementById('mobileDrawerCloseBtn');

      if (!toggleBtn || !drawer) return;

      const openDrawer = () => {
        drawer.classList.add('open');
        if (overlay) overlay.classList.add('active');
        toggleBtn.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus first link in drawer for keyboard accessibility
        const firstLink = drawer.querySelector('a, button');
        if (firstLink) firstLink.focus();
      };

      const closeDrawer = () => {
        drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };

      toggleBtn.addEventListener('click', () => {
        const isOpen = drawer.classList.contains('open');
        if (isOpen) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          closeDrawer();
          toggleBtn.focus();
        });
      }

      if (overlay) {
        overlay.addEventListener('click', () => {
          closeDrawer();
          toggleBtn.focus();
        });
      }

      // Close drawer on link clicks
      drawer.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', () => {
          if (!el.id.includes('mobileDrawerCloseBtn')) {
            closeDrawer();
          }
        });
      });

      // Escape key handler for drawer accessibility
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
          closeDrawer();
          toggleBtn.focus();
        }
      });
    },

    initHeaderScroll: function () {
      const header = document.querySelector('.header');
      if (header) {
        window.addEventListener('scroll', () => {
          if (window.scrollY > 20) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        });
      }
    },

    /* ------------------------------------------------------------------------
       MODALS & DIALOGS
       ------------------------------------------------------------------------ */
    initModals: function () {
      // Close modal on backdrop click or close button
      document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            this.closeModal(backdrop.id);
          }
        });

        const closeBtns = backdrop.querySelectorAll('[data-close-modal]');
        closeBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            this.closeModal(backdrop.id);
          });
        });
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
            this.closeModal(modal.id);
          });
        }
      });
    },

    openModal: function (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    },

    closeModal: function (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    },

    openLoginModal: function () {
      this.closeModal('registerModal');
      this.closeModal('authModal');
      this.openModal('loginModal');
      const emailInput = document.getElementById('loginEmailInput');
      if (emailInput) setTimeout(() => emailInput.focus(), 100);
    },

    openRegisterModal: function () {
      this.closeModal('loginModal');
      this.closeModal('authModal');
      this.setRegisterRole('customer'); // Preselect Customer by default
      this.populateStateDropdown();
      const successBox = document.getElementById('regSuccessNoticeContainer');
      if (successBox) successBox.style.display = 'none';
      const formsBox = document.getElementById('regFormsContainer');
      if (formsBox) formsBox.style.display = 'block';
      this.openModal('registerModal');
      const nameInput = document.getElementById('regCustNameInput');
      if (nameInput) setTimeout(() => nameInput.focus(), 100);
    },

    populateStateDropdown: function () {
      if (typeof window !== 'undefined' && window.populateAllStateSelects) {
        window.populateAllStateSelects();
        return;
      }

      const statesList = (typeof window !== 'undefined' && window.NIGERIA_STATES) ? window.NIGERIA_STATES : NIGERIA_STATES;
      const stateElements = [
        document.getElementById('heroStateSelect'),
        document.getElementById('filterStateSelect'),
        document.getElementById('state'),
        document.getElementById('custState'),
        document.getElementById('provState'),
        document.getElementById('setupState'),
        document.getElementById('profileState'),
        document.getElementById('requestState'),
        document.getElementById('regCustStateInput'),
        document.getElementById('regProvStateSelect')
      ].filter(Boolean);

      const uniqueStates = Array.from(new Set(statesList));

      stateElements.forEach(select => {
        const isFilter = select.id.includes('filter') || select.id.includes('hero') || select.getAttribute('data-populate') === 'states';
        const defaultLabel = isFilter ? 'All States (Nigeria)' : 'Select State';
        const defaultVal = isFilter ? 'all' : '';
        const currentVal = select.value || defaultVal;

        select.innerHTML = `<option value="${defaultVal}">${defaultLabel}</option>`;
        uniqueStates.forEach(st => {
          const opt = document.createElement('option');
          opt.value = st;
          opt.textContent = st;
          if (currentVal && currentVal === st) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
        if (currentVal && (currentVal === defaultVal || uniqueStates.includes(currentVal))) {
          select.value = currentVal;
        }
      });
    },

    switchToLoginModal: function () {
      this.closeModal('registerModal');
      this.openLoginModal();
    },

    switchToRegisterModal: function () {
      this.closeModal('loginModal');
      this.openRegisterModal();
    },

    setRegisterRole: function (role) {
      const custTab = document.getElementById('regRoleCustomerTab');
      const provTab = document.getElementById('regRoleProviderTab');
      const custWrap = document.getElementById('regCustomerFormWrap');
      const provWrap = document.getElementById('regProviderFormWrap');
      const successBox = document.getElementById('regSuccessNoticeContainer');
      const formsBox = document.getElementById('regFormsContainer');

      if (successBox) successBox.style.display = 'none';
      if (formsBox) formsBox.style.display = 'block';

      if (role === 'provider') {
        if (provTab) provTab.classList.add('active');
        if (custTab) custTab.classList.remove('active');
        if (provWrap) provWrap.style.display = 'block';
        if (custWrap) custWrap.style.display = 'none';
        this.backToProviderStep1();
      } else {
        if (custTab) custTab.classList.add('active');
        if (provTab) provTab.classList.remove('active');
        if (custWrap) custWrap.style.display = 'block';
        if (provWrap) provWrap.style.display = 'none';
      }
    },

    isValidNigerianPhone: function (phone) {
      if (!phone) return false;
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');
      return /^(\+?234|0)[789][01]\d{8}$/.test(cleaned);
    },

    goToProviderStep2: function () {
      const name = (document.getElementById('regProvNameInput')?.value || '').trim();
      const email = (document.getElementById('regProvEmailInput')?.value || '').trim();
      const phone = (document.getElementById('regProvPhoneInput')?.value || '').trim();
      const state = (document.getElementById('regProvStateSelect')?.value || document.getElementById('state')?.value || '').trim();
      const city = (document.getElementById('regProvCityInput')?.value || '').trim();
      const address = (document.getElementById('regProvAddressInput')?.value || '').trim();
      const pass = document.getElementById('regProvPasswordInput')?.value || '';
      const confirmPass = document.getElementById('regProvConfirmPasswordInput')?.value || '';

      const phoneError = document.getElementById('regProvPhoneError');
      const passError = document.getElementById('regProvPasswordMatchError');

      if (!name || !email || !phone || !address || !pass || !confirmPass) {
        this.showToast('Please fill in all required basic information fields.', 'warning');
        return;
      }

      // Validate Nigerian Phone (+234)
      if (!this.isValidNigerianPhone(phone)) {
        if (phoneError) phoneError.style.display = 'block';
        this.showToast('Please enter a valid Nigerian phone number (e.g. +234 803 123 4567 or 0803 123 4567).', 'danger');
        return;
      } else {
        if (phoneError) phoneError.style.display = 'none';
      }

      // Validate Password
      if (pass.length < 6 || pass !== confirmPass) {
        if (passError) passError.style.display = 'block';
        this.showToast('Passwords must match and be at least 6 characters.', 'danger');
        return;
      } else {
        if (passError) passError.style.display = 'none';
      }

      // Step transition
      const step1View = document.getElementById('provStep1Content');
      const step2View = document.getElementById('provStep2Content');
      const node1 = document.getElementById('provStep1Node');
      const node2 = document.getElementById('provStep2Node');
      const divider = document.getElementById('provStepDivider');

      if (step1View) step1View.style.display = 'none';
      if (step2View) step2View.style.display = 'block';
      if (node1) {
        node1.classList.remove('active');
        node1.classList.add('completed');
        const circle = document.getElementById('provStep1Circle');
        if (circle) circle.textContent = '✓';
      }
      if (node2) node2.classList.add('active');
      if (divider) divider.classList.add('active');

      const modalDialog = document.querySelector('#registerModal .modal-dialog');
      if (modalDialog) modalDialog.scrollTop = 0;
    },

    backToProviderStep1: function () {
      const step1View = document.getElementById('provStep1Content');
      const step2View = document.getElementById('provStep2Content');
      const node1 = document.getElementById('provStep1Node');
      const node2 = document.getElementById('provStep2Node');
      const divider = document.getElementById('provStepDivider');

      if (step1View) step1View.style.display = 'block';
      if (step2View) step2View.style.display = 'none';
      if (node1) {
        node1.classList.add('active');
        node1.classList.remove('completed');
        const circle = document.getElementById('provStep1Circle');
        if (circle) circle.textContent = '1';
      }
      if (node2) node2.classList.remove('active');
      if (divider) divider.classList.remove('active');
    },

    toggleCategoryChip: function (btn) {
      btn.classList.toggle('selected');
      const container = document.getElementById('provCategoryChips');
      if (!container) return;
      const selectedChips = container.querySelectorAll('.category-chip-btn.selected');
      const cats = Array.from(selectedChips).map(c => c.getAttribute('data-cat'));
      
      // Ensure at least one is selected
      if (cats.length === 0) {
        btn.classList.add('selected');
        cats.push(btn.getAttribute('data-cat'));
      }

      const input = document.getElementById('regProvCategoriesInput');
      if (input) input.value = cats.join(',');
    },

    onIdTypeChange: function (type) {
      const label = document.getElementById('regProvNinLabel');
      const input = document.getElementById('regProvNinInput');
      const error = document.getElementById('regProvNinError');

      if (type === 'NIN') {
        if (label) label.innerHTML = 'NIN Number (11 Digits) <span class="required-mark">*</span>';
        if (input) {
          input.placeholder = 'e.g. 12345678901';
          input.maxLength = 11;
        }
      } else {
        if (label) label.innerHTML = `${type === 'VotersCard' ? "Voter's Card (PVC) VIN" : type === 'DriversLicense' ? "Driver's License Number" : "Passport Number"} <span class="required-mark">*</span>`;
        if (input) {
          input.placeholder = 'Enter ID number';
          input.maxLength = 20;
        }
      }
      if (error) error.style.display = 'none';
    },

    handleFileUpload: function (inputEl, boxId, nameId) {
      const box = document.getElementById(boxId);
      const nameDisplay = document.getElementById(nameId);

      if (!inputEl.files || inputEl.files.length === 0) {
        if (box) box.classList.remove('has-file');
        if (nameDisplay) nameDisplay.textContent = '';
        return;
      }

      const file = inputEl.files[0];
      const maxBytes = 5 * 1024 * 1024; // 5MB

      if (file.size > maxBytes) {
        this.showToast(`File "${file.name}" exceeds 5MB maximum limit. Please choose a smaller file.`, 'danger');
        inputEl.value = '';
        if (box) box.classList.remove('has-file');
        if (nameDisplay) nameDisplay.textContent = '';
        return;
      }

      if (box) box.classList.add('has-file');
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      if (nameDisplay) {
        nameDisplay.textContent = `✓ ${file.name} (${sizeMb} MB)`;
      }
      this.showToast(`Uploaded: ${file.name}`, 'info');
    },

    closeRegisterSuccess: function () {
      this.closeModal('registerModal');
      const successBox = document.getElementById('regSuccessNoticeContainer');
      const formsBox = document.getElementById('regFormsContainer');
      if (successBox) successBox.style.display = 'none';
      if (formsBox) formsBox.style.display = 'block';
    },

    togglePasswordVisibility: function (inputId, btnEl) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (btnEl) btnEl.textContent = '🔒';
      } else {
        input.type = 'password';
        if (btnEl) btnEl.textContent = '👁️';
      }
    },

    initAuthForms: function () {
      // Login Form Handler
      const loginForm = document.getElementById('loginModalForm');
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const emailInput = document.getElementById('loginEmailInput');
          const passInput = document.getElementById('loginPasswordInput');
          const email = emailInput ? emailInput.value.trim() : '';
          const pass = passInput ? passInput.value.trim() : '';

          if (!email || !pass) {
            this.showToast('Please enter your email/phone and password.', 'warning');
            return;
          }

          if (window.HandyAuth) {
            try {
              if (window.HandyAuth.loginAsync) {
                const user = await window.HandyAuth.loginAsync(email, pass);
                this.closeModal('loginModal');
                this.showToast(`Logged in successfully! Welcome back, ${user.name}.`, 'success');
                loginForm.reset();
                setTimeout(() => {
                  if (window.HandyAuth.redirectToDashboard) {
                    window.HandyAuth.redirectToDashboard(user.role);
                  }
                }, 600);
                return;
              }
            } catch (err) {
              // Fallback to synchronous mock login
            }
            const isAdmin = email.toLowerCase().includes('admin');
            const isProv = email.toLowerCase().includes('prov') || email.toLowerCase().includes('john');
            const role = isAdmin ? 'admin' : (isProv ? 'provider' : 'customer');
            const user = window.HandyAuth.login(email, pass, role);
            this.closeModal('loginModal');
            this.showToast(`Logged in successfully! Welcome back, ${user.name}.`, 'success');
            loginForm.reset();
            setTimeout(() => {
              if (window.HandyAuth.redirectToDashboard) {
                window.HandyAuth.redirectToDashboard(user.role);
              }
            }, 600);
          }
        });
      }

      // Customer Register Form Handler (1 Step Flow)
      const custForm = document.getElementById('regCustomerModalForm');
      if (custForm) {
        custForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = (document.getElementById('regCustNameInput')?.value || '').trim();
          const email = (document.getElementById('regCustEmailInput')?.value || '').trim();
          const phone = (document.getElementById('regCustPhoneInput')?.value || '').trim();
          const state = (document.getElementById('state') || document.getElementById('regCustStateInput'))?.value || 'Anambra';
          const pass = document.getElementById('regCustPasswordInput')?.value || '';
          const confirmPass = document.getElementById('regCustConfirmPasswordInput')?.value || '';
          const termsCheck = document.getElementById('regCustTermsCheck');
          const matchError = document.getElementById('regCustPasswordMatchError');

          if (!name || !email || !phone || !pass) {
            this.showToast('Please fill in all required customer fields.', 'warning');
            return;
          }

          if (termsCheck && !termsCheck.checked) {
            this.showToast('Please agree to the Terms of Service to continue.', 'warning');
            return;
          }

          if (pass !== confirmPass || pass.length < 6) {
            if (matchError) matchError.style.display = 'block';
            this.showToast('Passwords do not match or are shorter than 6 characters.', 'danger');
            return;
          } else {
            if (matchError) matchError.style.display = 'none';
          }

          if (window.HandyAuth) {
            const newUser = window.HandyAuth.registerCustomer({
              name, email, phone, state, password: pass
            });
            this.closeModal('registerModal');
            this.showToast(`Account created! Welcome to HandyNaija, ${newUser.name}!`, 'success');
            custForm.reset();
          }
        });
      }

      // Provider Register Form Handler (2 Step Flow with SLA & Verification Storage)
      const provForm = document.getElementById('regProviderModalForm');
      if (provForm) {
        provForm.addEventListener('submit', (e) => {
          e.preventDefault();
          
          const name = (document.getElementById('regProvNameInput')?.value || '').trim();
          const email = (document.getElementById('regProvEmailInput')?.value || '').trim();
          const phone = (document.getElementById('regProvPhoneInput')?.value || '').trim();
          const state = (document.getElementById('regProvStateSelect') || document.getElementById('state'))?.value || 'Anambra';
          const city = (document.getElementById('regProvCityInput')?.value || '').trim();
          const address = (document.getElementById('regProvAddressInput')?.value || '').trim();
          const pass = document.getElementById('regProvPasswordInput')?.value || '';

          const categoriesInput = document.getElementById('regProvCategoriesInput')?.value || 'plumbing';
          const categories = categoriesInput.split(',').filter(Boolean);
          const experience = document.getElementById('regProvExperienceSelect')?.value || '3-5';
          const bio = (document.getElementById('regProvBioInput')?.value || '').trim();
          const idType = document.getElementById('regProvIdTypeSelect')?.value || 'NIN';
          const ninNumber = (document.getElementById('regProvNinInput')?.value || '').trim();
          const idFrontFile = document.getElementById('regProvIdFrontFile')?.files[0];
          const idBackFile = document.getElementById('regProvIdBackFile')?.files[0];
          const avatarFile = document.getElementById('regProvAvatarFile')?.files[0];
          const cacFile = document.getElementById('regProvCacFile')?.files[0];
          const guarantorName = (document.getElementById('regProvGuarantorName')?.value || '').trim();
          const guarantorPhone = (document.getElementById('regProvGuarantorPhone')?.value || '').trim();
          const consentCheck = document.getElementById('regProvConsentCheck');
          const ninError = document.getElementById('regProvNinError');

          // Strict validation: Contact Phone required and validated
          if (!this.isValidNigerianPhone(phone)) {
            this.showToast('Valid Nigerian contact phone number is required.', 'danger');
            this.backToProviderStep1();
            return;
          }

          // Strict validation: NIN / ID required
          if (!ninNumber) {
            this.showToast('Please enter your NIN or ID card number.', 'danger');
            if (ninError) ninError.style.display = 'block';
            return;
          }

          // 11 digits validation for NIN
          if (idType === 'NIN' && !/^\d{11}$/.test(ninNumber)) {
            if (ninError) ninError.style.display = 'block';
            this.showToast('NIN must be strictly 11 numerical digits.', 'danger');
            return;
          } else {
            if (ninError) ninError.style.display = 'none';
          }

          // Bio required
          if (!bio) {
            this.showToast('Please provide a brief bio or description of services.', 'warning');
            return;
          }

          // Consent checkbox required
          if (consentCheck && !consentCheck.checked) {
            this.showToast('You must agree to the background verification policy.', 'warning');
            return;
          }

          const providerData = {
            name,
            email,
            phone,
            state,
            city,
            address,
            password: pass,
            categories,
            experienceYears: experience,
            bio,
            idType,
            ninNumber,
            idPhotoFront: idFrontFile ? idFrontFile.name : 'nin_front_document.jpg',
            idPhotoBack: idBackFile ? idBackFile.name : 'nin_back_document.jpg',
            profilePhoto: avatarFile ? 'images/providers/provider-1.svg' : 'images/providers/provider-1.svg',
            cacDocument: cacFile ? cacFile.name : '',
            guarantorName,
            guarantorPhone,
            backgroundConsent: true,
            verificationStatus: 'pending',
            isVerified: false
          };

          if (window.HandyAuth) {
            const registered = window.HandyAuth.registerProvider(providerData);

            // Populate Success Screen
            const nameEl = document.getElementById('successProvName');
            const catEl = document.getElementById('successProvCategory');
            const idEl = document.getElementById('successProvIdType');
            
            if (nameEl) nameEl.textContent = registered.name;
            if (catEl) catEl.textContent = categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
            if (idEl) idEl.textContent = `${idType}: ${ninNumber}`;

            const formsBox = document.getElementById('regFormsContainer');
            const successBox = document.getElementById('regSuccessNoticeContainer');

            if (formsBox) formsBox.style.display = 'none';
            if (successBox) successBox.style.display = 'block';

            this.showToast('Application submitted! Your account will be reviewed and verified within 24 hours.', 'success');
            provForm.reset();
          }
        });
      }
    },

    /* ------------------------------------------------------------------------
       TOAST NOTIFICATIONS
       ------------------------------------------------------------------------ */
    showToast: function (message, type = 'info') {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      const iconMap = {
        success: '✅',
        warning: '⚠️',
        danger: '❌',
        info: 'ℹ️'
      };

      toast.innerHTML = `
        <span>${iconMap[type] || 'ℹ️'}</span>
        <div style="flex: 1;">${message}</div>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.transition = 'opacity 250ms, transform 250ms';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    /* ------------------------------------------------------------------------
       NAVBAR AUTH UI STATE
       ------------------------------------------------------------------------ */
    updateAuthUI: function (role, user) {
      const authButtonArea = document.getElementById('headerAuthArea');
      const mobileDrawerAuthArea = document.getElementById('mobileDrawerAuthArea');

      const isGuest = !user || role === 'guest';

      const guestHtml = `
        <div class="public-auth-group">
          <button type="button" class="btn btn-outline btn-sm" id="headerLoginBtn" onclick="HandyMain.openLoginModal()">Login</button>
          <button type="button" class="btn btn-primary btn-sm" id="headerRegisterBtn" onclick="HandyMain.openRegisterModal()">Register</button>
        </div>
      `;

      const userHtml = !isGuest ? `
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <div class="provider-avatar" style="width: 34px; height: 34px; border: 2px solid var(--color-primary); flex-shrink: 0;">
              <img src="${user.avatar || 'images/providers/provider-1.svg'}" alt="${user.name}">
            </div>
            <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
              <span style="font-size: var(--font-size-caption); font-weight: 700; color: var(--color-text-primary); max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</span>
              <span style="font-size: 0.65rem; color: var(--color-primary); text-transform: capitalize; font-weight: 600;">${user.role}</span>
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="HandyAuth.logout(); HandyMain.showToast('Logged out successfully', 'info');" style="padding: 4px 8px; font-size: 0.75rem; color: var(--color-text-secondary);" title="Log out">
            Log Out
          </button>
        </div>
      ` : guestHtml;

      if (authButtonArea) authButtonArea.innerHTML = userHtml;
      if (mobileDrawerAuthArea) {
        mobileDrawerAuthArea.innerHTML = !isGuest ? `
          <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div class="provider-avatar" style="width: 44px; height: 44px; border: 2px solid var(--color-primary);">
              <img src="${user.avatar || 'images/providers/provider-1.svg'}" alt="${user.name}">
            </div>
            <div>
              <div style="font-weight: 700; font-size: var(--font-size-label);">${user.name}</div>
              <div style="font-size: var(--font-size-caption); color: var(--color-primary); text-transform: capitalize;">${user.role} Account</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-full btn-sm" onclick="HandyAuth.logout(); HandyMain.showToast('Logged out successfully', 'info');">Log Out</button>
        ` : `
          <button class="btn btn-outline btn-full" onclick="HandyMain.openLoginModal()">Login</button>
          <button class="btn btn-primary btn-full" onclick="HandyMain.openRegisterModal()">Register</button>
        `;
      }
    },

    /* ------------------------------------------------------------------------
       DEMO TABS
       ------------------------------------------------------------------------ */
    initDemoTabs: function () {
      const tabBtns = document.querySelectorAll('.demo-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-tab');
          this.switchDemoTab(targetTab);
        });
      });
    },

    switchDemoTab: function (tabName) {
      document.querySelectorAll('.demo-tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
      });

      document.querySelectorAll('.demo-tab-content').forEach(content => {
        content.style.display = content.getAttribute('data-tab-content') === tabName ? 'block' : 'none';
      });
    },

    /* ------------------------------------------------------------------------
       SERVICE CHIPS & REVIEWS
       ------------------------------------------------------------------------ */
    initInteractiveChips: function () {
      document.querySelectorAll('.service-chip-interactive').forEach(chip => {
        chip.addEventListener('click', () => {
          chip.classList.toggle('service-chip-selected');
        });
      });

      document.querySelectorAll('.chip-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const parent = btn.closest('.service-chip');
          if (parent) parent.remove();
        });
      });
    },

    initReviewForm: function () {
      const starInputs = document.querySelectorAll('.star-picker span');
      let currentRating = 5;

      starInputs.forEach(star => {
        star.addEventListener('click', () => {
          currentRating = parseInt(star.getAttribute('data-rating'), 10);
          starInputs.forEach((s, idx) => {
            s.classList.toggle('active', idx < currentRating);
            s.style.color = idx < currentRating ? 'var(--color-accent)' : 'var(--color-text-muted)';
          });
        });
      });

      const reviewForm = document.getElementById('submitReviewForm');
      if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.closeModal('reviewModal');
          this.showToast(`Review submitted (${currentRating}★)! Thank you for keeping HandyNaija trustworthy.`, 'success');
          reviewForm.reset();
        });
      }
    },

    /* ------------------------------------------------------------------------
       PUBLIC CONTACT FORM
       ------------------------------------------------------------------------ */
    initContactForm: function () {
      const contactForm = document.getElementById('publicContactForm');
      if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameInput = document.getElementById('contactName');
          const name = nameInput ? nameInput.value.trim() : 'Customer';
          this.showToast(`Thank you ${name}! Your inquiry has been sent to our HandyNaija Support Team.`, 'success');
          contactForm.reset();
        });
      }
    },

    /* ------------------------------------------------------------------------
       HERO ARTISAN IMAGE CAROUSEL (4-SECOND AUTO-ROTATION)
       ------------------------------------------------------------------------ */
    initHeroCarousel: function () {
      const carousel = document.getElementById('heroArtisanCarousel');
      const dotsContainer = document.getElementById('heroCarouselDots');
      if (!carousel) return;

      const slides = carousel.querySelectorAll('.hero-carousel-slide');
      const dots = dotsContainer ? dotsContainer.querySelectorAll('.hero-carousel-dot') : [];
      if (slides.length <= 1) return;

      let currentIndex = 0;
      let timer = null;

      const goToSlide = (index) => {
        currentIndex = (index + slides.length) % slides.length;

        slides.forEach((slide, idx) => {
          if (idx === currentIndex) {
            slide.classList.add('active');
          } else {
            slide.classList.remove('active');
          }
        });

        dots.forEach((dot, idx) => {
          if (idx === currentIndex) {
            dot.classList.add('active');
            dot.setAttribute('aria-selected', 'true');
          } else {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
          }
        });
      };

      const startAutoRotate = () => {
        stopAutoRotate();
        timer = setInterval(() => {
          goToSlide(currentIndex + 1);
        }, 4000);
      };

      const stopAutoRotate = () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };

      // Dot click handlers
      dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
          goToSlide(idx);
          startAutoRotate(); // Reset 4-second interval on user click
        });
      });

      // Pause rotation on hover / focus for accessibility
      carousel.addEventListener('mouseenter', stopAutoRotate);
      carousel.addEventListener('mouseleave', startAutoRotate);
      carousel.addEventListener('focusin', stopAutoRotate);
      carousel.addEventListener('focusout', startAutoRotate);

      // Start the 4-second auto-rotation
      startAutoRotate();
    }
  };

  // Expose globally and run on DOM ready
  window.HandyMain = HandyMain;

  document.addEventListener('DOMContentLoaded', () => {
    HandyMain.init();
  });
})(window);
