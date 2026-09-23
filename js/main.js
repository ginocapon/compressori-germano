/* ============================================
   CRONO SERVICE — Main JavaScript
   ============================================ */

(function injectCronoWatermark() {
  if (document.querySelector('.brand-watermark')) return;
  var mark =
    '<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M22 68c-8-3-14-3-22-1" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M18 100H0" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M22 132c-8 3-14 5-22 5" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="86" y="10" width="28" height="20" rx="4" stroke="currentColor" stroke-width="7"/>' +
      '<path d="M74 30h52" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
      '<circle cx="100" cy="114" r="66" stroke="currentColor" stroke-width="8"/>' +
      '<circle cx="100" cy="114" r="50" stroke="currentColor" stroke-width="2.4" opacity="0.45"/>' +
      '<path d="M100 56v12M100 160v12M42 114h12M146 114h12" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M100 114l30-24" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M100 114l-6 34" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="100" cy="114" r="8" fill="currentColor"/>' +
    '</svg>';
  var wrap = document.createElement('div');
  wrap.className = 'brand-watermark';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<div class="brand-watermark-item brand-watermark-a">' + mark + '</div>' +
    '<div class="brand-watermark-item brand-watermark-b">' + mark + '</div>' +
    '<div class="brand-watermark-item brand-watermark-word">CRONO</div>';
  document.body.insertBefore(wrap, document.body.firstChild);
})();

// Navbar scroll effect
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// Scroll reveal animations
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// FAQ toggle
document.querySelectorAll('.faq-item').forEach(item => {
  const content = item.querySelector('div:last-child');
  const icon = item.querySelector('.fa-chevron-down');

  if (item.classList.contains('open')) {
    content.style.display = 'block';
    if (icon) icon.style.transform = 'rotate(180deg)';
  }

  item.querySelector('div:first-child').addEventListener('click', () => {
    const isOpen = content.style.display === 'block';
    content.style.display = isOpen ? 'none' : 'block';
    if (icon) icon.style.transform = isOpen ? 'rotate(0)' : 'rotate(180deg)';
  });
});

// Mobile nav toggle + dropdowns
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const SITE_ROOT = document.body && document.body.dataset.root ? document.body.dataset.root : '';
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('.nav-drop > a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 1280) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });
  navLinks.querySelectorAll('a').forEach(link => {
    if (link.parentElement.classList.contains('nav-drop') && link.parentElement.querySelector(':scope > a') === link) return;
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============ MOBILE STICKY CTA BAR ============
(function() {
  var mobileCta = document.getElementById('mobileCta');
  if (!mobileCta) return;
  var shown = false;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 100 && !shown) {
      mobileCta.classList.add('visible');
      shown = true;
    } else if (window.scrollY <= 100 && shown) {
      mobileCta.classList.remove('visible');
      shown = false;
    }
  });
})();

// ============ CHATBOT AUTO-OPEN (solo homepage) ============
(function() {
  var isHomepage = window.location.pathname === '/' ||
                   window.location.pathname.endsWith('/index.html') ||
                   window.location.pathname.endsWith('/index.htm') ||
                   window.location.pathname === '';
  if (!isHomepage) return;

  // Auto-open solo su desktop e iPad, NON su mobile
  var isMobile = window.innerWidth < 768;
  if (isMobile) return;

  var alreadyShown = sessionStorage.getItem('chatbotAutoOpened');
  if (alreadyShown) return;

  setTimeout(function() {
    var chatWindow = document.getElementById('chatbot-window');
    var chatToggle = document.getElementById('chatbot-toggle');
    if (!chatWindow || chatWindow.classList.contains('open')) return;

    chatWindow.classList.add('open');
    if (chatToggle) chatToggle.classList.add('active');

    // Aggiungi messaggio proattivo di consulenza
    chatbotAddMessage('Ciao! Stai cercando un compressore o hai bisogno di assistenza? <strong>Offriamo una consulenza gratuita</strong> per trovare la soluzione ideale per la tua azienda. Scrivimi o scegli un argomento qui sotto!', false);

    sessionStorage.setItem('chatbotAutoOpened', '1');
  }, 3000);
})();

// ============ CHATBOT ============
const chatbotResponses = {
  'servizi': 'Offriamo: impianti, analisi energetiche Crono Scan, qualità aria ISO 8573, burocrazia PED, manutenzione Crono Care, ricerca perdite, verifiche serbatoi, noleggio sale compressori e formazione. Visita <a href="' + SITE_ROOT + 'servizi.html" style="color:var(--arancione);font-weight:600;">Servizi</a>.',
  'preventivo': 'Per un preventivo: <strong>049 000 1111</strong>, <strong>info@cronoservice.demo</strong> o il modulo <a href="' + SITE_ROOT + 'contatti.html" style="color:var(--arancione);font-weight:600;">Contatti</a>. Rispondiamo entro 24 ore.',
  'oil-free': 'I compressori oil-free AeroKraft garantiscono aria Classe 0 ISO 8573-1. Dettagli in <a href="' + SITE_ROOT + 'prodotti.html#oilfree" style="color:var(--arancione);font-weight:600;">Catalogo</a>.',
  'contatti': '<strong>Tel:</strong> 049 000 1111<br><strong>Email:</strong> info@cronoservice.demo<br><strong>Indirizzo:</strong> Via dell\'Industria, 42 — 35100 Padova<br><strong>Orari:</strong> Lun-Ven 8:00-18:00, Sab 8:00-12:00',
  'manutenzione': 'Crono Care: manutenzione ogni 2.000-4.000 ore, ricambi AeroKraft/Flowline, intervento medio 4 ore. <a href="' + SITE_ROOT + 'assistenza.html" style="color:var(--arancione);font-weight:600;">Assistenza</a>.',
  'noleggio': 'Noleggio macchine e sale compressori complete. <a href="' + SITE_ROOT + 'servizi/noleggio-locali-compressori.html" style="color:var(--arancione);font-weight:600;">Noleggio locali</a>.',
  'risparmio': 'Crono Scan misura i consumi una settimana senza fermi. Risparmio medio 25-35%. <a href="' + SITE_ROOT + 'servizi/analisi-energetiche.html" style="color:var(--arancione);font-weight:600;">Analisi energetiche</a>.',
  'usato': 'Parco usato ricondizionato serie CS (AeroKraft) e essiccatori Flowline, con collaudo e garanzia. <a href="' + SITE_ROOT + 'usato.html" style="color:var(--arancione);font-weight:600;">Usato</a>.',
  'tubazioni': 'Reti Crono Pipe in alluminio e inox: giunti a innesto rapido, bassa perdita di carico. <a href="' + SITE_ROOT + 'prodotti/tubazioni.html" style="color:var(--arancione);font-weight:600;">Tubazioni</a>.',
  'default': 'Scrivici al <strong>049 000 1111</strong> o <strong>info@cronoservice.demo</strong>. Pagina <a href="' + SITE_ROOT + 'contatti.html" style="color:var(--arancione);font-weight:600;">Contatti</a>.'
};

function chatbotGetResponse(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('servizi') || lower.includes('cosa fate') || lower.includes('offrite'))
    return chatbotResponses['servizi'];
  if (lower.includes('preventivo') || lower.includes('prezzo') || lower.includes('costo') || lower.includes('quanto'))
    return chatbotResponses['preventivo'];
  if (lower.includes('oil-free') || lower.includes('oil free') || lower.includes('oilfree') || lower.includes('pura'))
    return chatbotResponses['oil-free'];
  if (lower.includes('contatt') || lower.includes('telefon') || lower.includes('email') || lower.includes('orari') || lower.includes('dove'))
    return chatbotResponses['contatti'];
  if (lower.includes('manutenz') || lower.includes('assistenz') || lower.includes('riparaz'))
    return chatbotResponses['manutenzione'];
  if (lower.includes('noleggi') || lower.includes('affitt'))
    return chatbotResponses['noleggio'];
  if (lower.includes('risparm') || lower.includes('energe') || lower.includes('consum') || lower.includes('airscan') || lower.includes('crono scan'))
    return chatbotResponses['risparmio'];
  if (lower.includes('usato') || lower.includes('seconda mano') || lower.includes('ricondizion'))
    return chatbotResponses['usato'];
  if (lower.includes('tubaz') || lower.includes('allumin') || lower.includes('crono pipe'))
    return chatbotResponses['tubazioni'];
  return chatbotResponses['default'];
}

function chatbotAddMessage(text, isUser) {
  var messagesEl = document.getElementById('chatbot-messages');
  if (!messagesEl) return;
  var msgDiv = document.createElement('div');
  msgDiv.className = 'chat-msg ' + (isUser ? 'user' : 'bot');
  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = text;
  msgDiv.appendChild(bubble);
  messagesEl.appendChild(msgDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function chatbotSend(text) {
  var quickEl = document.getElementById('chatbot-quick');
  if (quickEl) quickEl.style.display = 'none';
  chatbotAddMessage(text, true);
  // Simulate typing delay
  var typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg bot chat-typing';
  typingDiv.innerHTML = '<div class="chat-bubble">Sto scrivendo</div>';
  var messagesEl = document.getElementById('chatbot-messages');
  messagesEl.appendChild(typingDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  setTimeout(function() {
    if (typingDiv.parentNode) typingDiv.parentNode.removeChild(typingDiv);
    chatbotAddMessage(chatbotGetResponse(text), false);
  }, 800);
}

function chatbotSendInput() {
  var input = document.getElementById('chatbot-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  chatbotSend(text);
}
