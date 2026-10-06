/**
 * HandyNaija — In-App Messaging Module
 * Version 1.0 (MVP Frontend Foundation)
 * Manages customer-to-provider chat conversations, live composer, and simulated replies.
 */

(function (window) {
  'use strict';

  let activeConversationId = 'conv-1';

  const HandyMessages = {
    init: function () {
      this.initComposer();
      this.renderConversations();
      this.renderActiveThread();
    },

    openForRequest: function (requestId) {
      if (window.HandyMain) {
        window.HandyMain.closeModal('requestDetailsModal');
      }

      const demoSection = document.getElementById('demoWorkspaceSection');
      if (demoSection) {
        if (window.HandyMain) window.HandyMain.switchDemoTab('messages');
        const convs = window.HandyAPI ? window.HandyAPI.getConversations() : [];
        const matched = convs.find(c => c.requestId === requestId);
        if (matched) {
          activeConversationId = matched.id;
        }
        this.renderConversations();
        this.renderActiveThread();
        demoSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        const isPagesDir = window.location.pathname.includes('/pages/') || window.location.pathname.includes('\\pages\\');
        const targetUrl = isPagesDir ? 'messages.html?request=' + requestId : 'pages/messages.html?request=' + requestId;
        window.location.href = targetUrl;
      }
    },

    renderConversations: function () {
      const container = document.getElementById('chatConversationList');
      if (!container) return;

      const convs = window.HandyAPI ? window.HandyAPI.getConversations() : [];
      
      container.innerHTML = convs.map(c => `
        <div class="chat-conversation-item ${c.id === activeConversationId ? 'active' : ''}" onclick="HandyMessages.selectConversation('${c.id}')">
          <div class="provider-avatar" style="width: 36px; height: 36px;">
            <img src="images/providers/provider-1.svg" alt="${c.providerName}">
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 style="font-size: var(--font-size-xs); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.providerName}</h4>
              <span style="font-size: 0.65rem; color: var(--color-text-muted);">${c.lastMessageTime}</span>
            </div>
            <p style="font-size: 0.7rem; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;">${c.lastMessage}</p>
          </div>
        </div>
      `).join('');
    },

    selectConversation: function (convId) {
      activeConversationId = convId;
      this.renderConversations();
      this.renderActiveThread();
    },

    renderActiveThread: function () {
      const titleEl = document.getElementById('chatHeaderTitle');
      const statusEl = document.getElementById('chatHeaderStatus');
      const messagesContainer = document.getElementById('chatMessagesScroll');

      if (!messagesContainer) return;

      const convs = window.HandyAPI ? window.HandyAPI.getConversations() : [];
      const activeConv = convs.find(c => c.id === activeConversationId) || convs[0];

      if (!activeConv) {
        messagesContainer.innerHTML = `<div class="empty-state"><p>No conversation selected.</p></div>`;
        return;
      }

      if (titleEl) titleEl.textContent = activeConv.providerName;
      if (statusEl) statusEl.textContent = `Regarding Request #${activeConv.requestId || 'General'} • Online`;

      messagesContainer.innerHTML = activeConv.messages.map(m => {
        const isOutgoing = m.sender === 'customer';
        return `
          <div class="chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}">
            <div>${m.text}</div>
            <span class="chat-timestamp">${m.time}</span>
          </div>
        `;
      }).join('');

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    initComposer: function () {
      const form = document.getElementById('chatComposerForm');
      const input = document.getElementById('chatMessageInput');

      if (!form || !input) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        window.HandyAPI.sendMessage(activeConversationId, text, 'customer');
        input.value = '';
        this.renderConversations();
        this.renderActiveThread();

        // Simulate provider automatic reply for interactive prototype feel
        setTimeout(() => {
          const autoReplies = [
            'Thanks for the message! I have taken note of that.',
            'Understood, I am gathering the necessary tools now.',
            'No problem at all. I will arrive promptly as agreed.',
            'Noted with thanks! Feel free to call if anything else arises.'
          ];
          const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
          window.HandyAPI.sendMessage(activeConversationId, reply, 'provider');
          HandyMessages.renderConversations();
          HandyMessages.renderActiveThread();
          if (window.HandyMain) {
            window.HandyMain.showToast('New reply received from provider', 'info');
          }
        }, 1200);
      });
    }
  };

  window.HandyMessages = HandyMessages;
})(window);
