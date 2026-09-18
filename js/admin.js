/* ============================================
   CRONO SERVICE — Admin Panel Logic
   localStorage persistence for all CRUD data
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


// ============ DATA STORE ============
const DEFAULT_PRODOTTI = [
  { id: 1, nome: 'Serie CS — Compressori a Vite', categoria: 'Lubrificati', prezzo: 'Da 8.500', stato: 'Attivo', descrizione: 'Compressori rotativi a vite lubrificati ad alta efficienza per applicazioni industriali.', specifiche: 'Potenza: 5-500 kW | Portata: 8-1200 l/s | Pressione: 7-13 bar', immagine: '', sku: 'CS-VITE-001', data: '2026-01-10' },
  { id: 2, nome: 'Serie CS VSD — Velocita Variabile', categoria: 'Lubrificati', prezzo: 'Da 12.000', stato: 'Attivo', descrizione: 'Compressori a velocita variabile con risparmio energetico fino al 50%.', specifiche: 'Potenza: 7-315 kW | Risparmio: fino al 50% | Classe IE5', immagine: '', sku: 'CS-VSD-001', data: '2026-01-15' },
  { id: 3, nome: 'Serie CS-OF — Oil-Free', categoria: 'Oil-Free', prezzo: 'Da 18.000', stato: 'Attivo', descrizione: 'Aria compressa 100% pura, certificata Classe 0 ISO 8573-1.', specifiche: 'Potenza: 15-500 kW | Classe 0 | Ideale: alimentare, farmaceutico', immagine: '', sku: 'CS-OF-001', data: '2026-01-20' },
  { id: 4, nome: 'Essiccatori CS-FD', categoria: 'Trattamento Aria', prezzo: 'Da 3.200', stato: 'Attivo', descrizione: 'Essiccatori a refrigerazione e ad adsorbimento per trattamento aria compressa.', specifiche: 'Portata: 6-6500 l/s | Punto di rugiada: +3°C / -40°C / -70°C', immagine: '', sku: 'CS-ESS-001', data: '2026-02-01' },
  { id: 5, nome: 'Gruppi Elettrogeni CS-G', categoria: 'Generatori', prezzo: 'Su richiesta', stato: 'Attivo', descrizione: 'Gruppi elettrogeni silenziati per cantieri, eventi e backup industriale.', specifiche: 'Potenza: 20-1000 kVA | Diesel | Livello sonoro: 65-75 dB(A)', immagine: '', sku: 'CS-GEN-001', data: '2026-02-05' },
  { id: 6, nome: 'Generatori Azoto CS-N2', categoria: 'Generatori', prezzo: 'Su richiesta', stato: 'Attivo', descrizione: 'Generazione azoto on-site con tecnologia PSA, elimina le bombole.', specifiche: 'Purezza: 95-99.999% | Portata: 2-5000 Nm3/h', immagine: '', sku: 'CS-N2-001', data: '2026-02-10' },
  { id: 7, nome: 'Tubazioni Crono Pipe', categoria: 'Accessori', prezzo: 'Da 45/metro', stato: 'Attivo', descrizione: 'Sistema di tubazioni in alluminio per distribuzione aria compressa.', specifiche: 'Diametro: 20-160mm | Pressione max: 13 bar | Garanzia 10 anni', immagine: '', sku: 'CS-TUB-001', data: '2026-02-15' },
  { id: 8, nome: 'Filtri CS-F', categoria: 'Trattamento Aria', prezzo: 'Da 180', stato: 'Attivo', descrizione: 'Filtri aria compressa per rimozione olio, polveri e odori.', specifiche: 'Efficienza: 99.9999% | Portata: fino a 3600 l/s', immagine: '', sku: 'CS-FIL-001', data: '2026-02-18' },
  { id: 9, nome: 'Compressori Portatili CS-M', categoria: 'Accessori', prezzo: 'Da 6.500', stato: 'Attivo', descrizione: 'Compressori portatili diesel per cantieri e applicazioni mobili.', specifiche: 'Portata: 2-30 m3/min | Diesel | Rimorchiabili', immagine: '', sku: 'CS-PORT-001', data: '2026-02-20' },
  { id: 10, nome: 'Serie CS-SC — Scroll Oil-Free', categoria: 'Oil-Free', prezzo: 'Da 4.800', stato: 'Attivo', descrizione: 'Compressori scroll oil-free per laboratori, odontoiatria e piccole produzioni.', specifiche: 'Potenza: 1.5-22 kW | Silenzioso: 62 dB(A) | Classe 0', immagine: '', sku: 'CS-SCR-001', data: '2026-02-25' },
  { id: 11, nome: 'Ricevitori Aria / Serbatoi', categoria: 'Accessori', prezzo: 'Da 350', stato: 'Attivo', descrizione: 'Serbatoi aria compressa verniciati e zincati, omologati PED.', specifiche: 'Capacita: 50-10000 litri | Pressione: 11-16 bar | PED/CE', immagine: '', sku: 'CS-SERB-001', data: '2026-03-01' },
  { id: 12, nome: 'Recuperatori Calore CS-R', categoria: 'Accessori', prezzo: 'Da 2.800', stato: 'Attivo', descrizione: 'Recupero calore dal compressore per riscaldamento acqua e ambienti.', specifiche: 'Recupero: fino al 94% | Acqua calda: fino a 90°C', immagine: '', sku: 'CS-REC-001', data: '2026-03-05' },
];

const DEFAULT_CLIENTI = [
  { id: 1, nome: 'Paolo Demo', azienda: 'Demo Metal SpA', email: 'paolo.demo@cronoservice.demo', telefono: '+39 049 000 1010', indirizzo: 'Via Demo 15, 35100 Padova', piva: 'IT00000000001', tipo: 'Cliente', settore: 'Metalmeccanico', note: 'Contratto manutenzione annuale attivo. 3 compressori CS VSD.', data: '2025-06-10' },
  { id: 2, nome: 'Chiara Demo', azienda: 'Demo Food Srl', email: 'chiara.demo@cronoservice.demo', telefono: '+39 049 000 1020', indirizzo: 'Via Demo 8, 35100 Padova', piva: 'IT00000000002', tipo: 'Cliente', settore: 'Alimentare', note: 'Interessata a upgrade oil-free per linea confezionamento.', data: '2025-08-20' },
  { id: 3, nome: 'Stefano Demo', azienda: 'Demo Officine', email: 'stefano.demo@cronoservice.demo', telefono: '+39 049 000 1030', indirizzo: 'Via Demo 22, 35100 Padova', piva: 'IT00000000003', tipo: 'Cliente', settore: 'Metalmeccanico', note: 'Noleggio compressore emergenza in corso.', data: '2025-10-15' },
  { id: 4, nome: 'Laura Demo', azienda: 'Demo Pharma', email: 'laura.demo@cronoservice.demo', telefono: '+39 049 000 1040', indirizzo: 'Via Demo 30, 35100 Padova', piva: 'IT00000000004', tipo: 'VIP', settore: 'Farmaceutico', note: 'Cliente VIP. 5 impianti oil-free CS-OF. Contratto full-service.', data: '2024-03-01' },
  { id: 5, nome: 'Andrea Demo', azienda: 'Demo Brew', email: 'andrea.demo@cronoservice.demo', telefono: '+39 049 000 1050', indirizzo: 'Via Demo 5, 35100 Padova', piva: 'IT00000000005', tipo: 'Cliente', settore: 'Alimentare', note: 'Generatore azoto CS-N2 installato per imbottigliamento.', data: '2025-04-12' },
  { id: 6, nome: 'Giovanni Demo', azienda: 'Demo Edil', email: 'giovanni.demo@cronoservice.demo', telefono: '+39 049 000 1060', indirizzo: 'Via Demo 100, 35100 Padova', piva: 'IT00000000006', tipo: 'Prospect', settore: 'Edilizia', note: 'Richiesto preventivo compressori portatili per cantieri.', data: '2026-02-28' },
  { id: 7, nome: 'Elena Demo', azienda: 'Demo Auto', email: 'elena.demo@cronoservice.demo', telefono: '+39 049 000 1070', indirizzo: 'Via Demo 50, 35100 Padova', piva: 'IT00000000007', tipo: 'VIP', settore: 'Automotive', note: 'Impianto completo aria compressa + trattamento. 8 macchine.', data: '2024-01-15' },
];

const DEFAULT_BLOG = [
  { id: 1, titolo: 'Guida Manutenzione Compressore', slug: 'manutenzione-compressore-guida', categoria: 'Manutenzione', stato: 'Pubblicato', data: '2026-03-05', immagine: '', meta: 'Guida completa alla manutenzione dei compressori industriali.', contenuto: '' },
  { id: 2, titolo: 'Oil-Free vs Lubrificato', slug: 'oil-free-vs-lubrificato', categoria: 'Guide', stato: 'Pubblicato', data: '2026-02-28', immagine: '', meta: '', contenuto: '' },
  { id: 3, titolo: 'Risparmio Energetico 30%', slug: 'risparmio-energetico-compressori', categoria: 'Efficienza', stato: 'Pubblicato', data: '2026-02-20', immagine: '', meta: '', contenuto: '' },
  { id: 4, titolo: 'Normativa Compressori 2026', slug: 'normativa-compressori-2026', categoria: 'Normative', stato: 'Pubblicato', data: '2026-02-15', immagine: '', meta: '', contenuto: '' },
  { id: 5, titolo: 'VSD+ Inverter: Risparmio 50%', slug: 'vsd-inverter-risparmio', categoria: 'Efficienza', stato: 'Pubblicato', data: '2026-02-08', immagine: '', meta: '', contenuto: '' },
  { id: 6, titolo: 'Generazione Azoto On-Site', slug: 'generazione-azoto-on-site', categoria: 'Guide', stato: 'Pubblicato', data: '2026-02-01', immagine: '', meta: '', contenuto: '' },
  { id: 7, titolo: 'Perdite Aria Compressa: Costi', slug: 'perdite-aria-compressa-costi', categoria: 'Manutenzione', stato: 'Pubblicato', data: '2026-01-25', immagine: '', meta: '', contenuto: '' },
  { id: 8, titolo: 'Tubazioni in alluminio Crono Pipe', slug: 'tubazioni-alluminio', categoria: 'Novita', stato: 'Pubblicato', data: '2026-01-18', immagine: '', meta: '', contenuto: '' },
  { id: 9, titolo: 'Progettazione Sala Compressori', slug: 'progettazione-sala-compressori', categoria: 'Guide', stato: 'Pubblicato', data: '2026-01-10', immagine: '', meta: '', contenuto: '' },
];

const DEFAULT_MESSAGGI = [
  { id: 1, data: '2026-03-07', nome: 'Paolo Demo', azienda: 'Demo Metal SpA', servizio: 'Manutenzione', stato: 'Nuovo', messaggio: 'Buongiorno, vorrei programmare la manutenzione annuale per i nostri 3 compressori CS VSD.' },
  { id: 2, data: '2026-03-06', nome: 'Chiara Demo', azienda: 'Demo Food Srl', servizio: 'Oil-Free', stato: 'Nuovo', messaggio: 'Interessata a preventivo per compressore oil-free CS-OF per linea confezionamento.' },
  { id: 3, data: '2026-03-05', nome: 'Stefano Demo', azienda: 'Demo Officine', servizio: 'Noleggio', stato: 'In lavorazione', messaggio: 'Richiesta noleggio compressore emergenza per 2 settimane.' },
  { id: 4, data: '2026-03-04', nome: 'Laura Demo', azienda: 'Demo Pharma', servizio: 'Diagnosi', stato: 'Risposto', messaggio: 'Vorremmo fare una diagnosi energetica Crono Scan sul nostro impianto.' },
  { id: 5, data: '2026-03-03', nome: 'Andrea Demo', azienda: 'Demo Brew', servizio: 'Generatore N2', stato: 'Risposto', messaggio: 'Informazioni sul generatore di azoto per la nostra linea di imbottigliamento.' },
];

// ============ LOAD/SAVE ============
function loadData(key, defaults) {
  try {
    var stored = localStorage.getItem('crono_' + key);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(defaults));
}

function saveData(key, data) {
  try {
    localStorage.setItem('crono_' + key, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

var prodotti = loadData('prodotti', DEFAULT_PRODOTTI);
var clienti = loadData('clienti', DEFAULT_CLIENTI);
var blog = loadData('blog', DEFAULT_BLOG);
var messaggi = loadData('messaggi', DEFAULT_MESSAGGI);

// ============ AUTH ============
function handleLogin(e) {
  e.preventDefault();
  var user = document.getElementById('loginUser').value;
  var pass = document.getElementById('loginPass').value;
  if (user === 'crono' && pass === '12345') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    sessionStorage.setItem('crono_auth', '1');
    initDashboard();
  } else {
    showToast('Credenziali non valide. Usa: crono / 12345', 'error');
  }
}

function logout() {
  sessionStorage.removeItem('crono_auth');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

// Auto-login if session active
if (sessionStorage.getItem('crono_auth') === '1') {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
}

// ============ MOBILE SIDEBAR ============
function toggleMobileSidebar() {
  var sidebar = document.querySelector('.admin-sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('active');
}

function closeMobileSidebar() {
  document.querySelector('.admin-sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============ NAVIGATION ============
document.querySelectorAll('.admin-nav-item[data-section]').forEach(function(item) {
  item.addEventListener('click', function() {
    document.querySelectorAll('.admin-nav-item').forEach(function(i) { i.classList.remove('active'); });
    item.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('section-' + item.dataset.section).classList.add('active');
    closeMobileSidebar();
  });
});

// ============ TOAST ============
function showToast(msg, type) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'admin-toast show ' + (type || '');
  setTimeout(function() {
    toast.className = 'admin-toast';
  }, 3000);
}

// ============ HELPERS ============
function nextId(arr) {
  return arr.length ? Math.max.apply(null, arr.map(function(x) { return x.id; })) + 1 : 1;
}

function formatDate(d) {
  if (!d) return '';
  var parts = d.split('-');
  if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
  return d;
}

function todayISO() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function statoBadge(stato) {
  var cls = 'badge-success';
  if (stato === 'Bozza' || stato === 'In lavorazione' || stato === 'Pianificato' || stato === 'Prospect') cls = 'badge-warning';
  if (stato === 'Disattivato' || stato === 'Nuovo' || stato === 'Ex-cliente') cls = 'badge-error';
  return '<span class="badge ' + cls + '">' + stato + '</span>';
}

// ============ DASHBOARD ============
function initDashboard() {
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('statProdotti').textContent = prodotti.filter(function(p) { return p.stato === 'Attivo'; }).length;
  document.getElementById('statArticoli').textContent = blog.length;
  document.getElementById('statClienti').textContent = clienti.length;
  document.getElementById('statMessaggi').textContent = messaggi.length;

  // Recent activity
  var activities = [];
  blog.slice(0, 3).forEach(function(b) {
    activities.push({ data: b.data, tipo: 'Blog', titolo: b.titolo, stato: b.stato });
  });
  prodotti.slice(-2).reverse().forEach(function(p) {
    activities.push({ data: p.data, tipo: 'Prodotto', titolo: p.nome, stato: p.stato });
  });
  messaggi.slice(0, 2).forEach(function(m) {
    activities.push({ data: m.data, tipo: 'Messaggio', titolo: m.nome + ' — ' + m.servizio, stato: m.stato });
  });
  activities.sort(function(a, b) { return b.data.localeCompare(a.data); });

  var tbody = document.getElementById('dashActivity');
  tbody.innerHTML = activities.slice(0, 8).map(function(a) {
    var tipoBadge = a.tipo === 'Blog' ? 'badge-success' : a.tipo === 'Prodotto' ? 'badge-warning' : 'badge-error';
    return '<tr><td>' + formatDate(a.data) + '</td><td><span class="badge ' + tipoBadge + '">' + a.tipo + '</span></td><td>' + a.titolo + '</td><td>' + statoBadge(a.stato) + '</td></tr>';
  }).join('');

  renderProdotti();
  renderClienti();
  renderBlog();
  renderMessaggi();
}

// ============ PRODOTTI CRUD ============
function renderProdotti() {
  var search = (document.getElementById('prodottiSearch').value || '').toLowerCase();
  var filter = document.getElementById('prodottiFilter').value;
  var filtered = prodotti.filter(function(p) {
    var matchSearch = !search || p.nome.toLowerCase().includes(search) || (p.sku || '').toLowerCase().includes(search);
    var matchFilter = !filter || p.categoria === filter;
    return matchSearch && matchFilter;
  });

  var tbody = document.getElementById('prodottiTable');
  var empty = document.getElementById('prodottiEmpty');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = filtered.map(function(p) {
    return '<tr>' +
      '<td><strong>' + p.nome + '</strong></td>' +
      '<td>' + p.categoria + '</td>' +
      '<td>' + (p.prezzo || '—') + '</td>' +
      '<td><code style="font-size:0.8rem;">' + (p.sku || '—') + '</code></td>' +
      '<td>' + statoBadge(p.stato) + '</td>' +
      '<td><div class="admin-actions">' +
        '<button class="admin-action-btn" onclick="editProdotto(' + p.id + ')" title="Modifica"><i class="fas fa-edit"></i></button>' +
        '<button class="admin-action-btn delete" onclick="deleteProdotto(' + p.id + ')" title="Elimina"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
  }).join('');
}

function openProdottoForm() {
  document.getElementById('prodottoFormPanel').style.display = 'block';
  document.getElementById('prodottoFormTitle').textContent = 'Nuovo Prodotto';
  document.getElementById('prodottoForm').reset();
  document.getElementById('prodottoId').value = '';
  document.getElementById('prodottoFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeProdottoForm() {
  document.getElementById('prodottoFormPanel').style.display = 'none';
}

function editProdotto(id) {
  var p = prodotti.find(function(x) { return x.id === id; });
  if (!p) return;
  document.getElementById('prodottoFormPanel').style.display = 'block';
  document.getElementById('prodottoFormTitle').textContent = 'Modifica Prodotto';
  document.getElementById('prodottoId').value = p.id;
  document.getElementById('prodottoNome').value = p.nome;
  document.getElementById('prodottoCategoria').value = p.categoria;
  document.getElementById('prodottoPrezzo').value = p.prezzo || '';
  document.getElementById('prodottoStato').value = p.stato;
  document.getElementById('prodottoDescrizione').value = p.descrizione || '';
  document.getElementById('prodottoSpecifiche').value = p.specifiche || '';
  document.getElementById('prodottoImmagine').value = p.immagine || '';
  document.getElementById('prodottoSKU').value = p.sku || '';
  document.getElementById('prodottoFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveProdotto(e) {
  e.preventDefault();
  var id = document.getElementById('prodottoId').value;
  var obj = {
    nome: document.getElementById('prodottoNome').value,
    categoria: document.getElementById('prodottoCategoria').value,
    prezzo: document.getElementById('prodottoPrezzo').value,
    stato: document.getElementById('prodottoStato').value,
    descrizione: document.getElementById('prodottoDescrizione').value,
    specifiche: document.getElementById('prodottoSpecifiche').value,
    immagine: document.getElementById('prodottoImmagine').value,
    sku: document.getElementById('prodottoSKU').value,
    data: todayISO()
  };

  if (id) {
    var idx = prodotti.findIndex(function(x) { return x.id === parseInt(id); });
    if (idx > -1) { obj.id = parseInt(id); obj.data = prodotti[idx].data; prodotti[idx] = obj; }
    showToast('Prodotto aggiornato con successo', 'success');
  } else {
    obj.id = nextId(prodotti);
    prodotti.push(obj);
    showToast('Prodotto creato con successo', 'success');
  }

  saveData('prodotti', prodotti);
  closeProdottoForm();
  renderProdotti();
  updateDashStats();
}

function deleteProdotto(id) {
  if (!confirm('Eliminare questo prodotto?')) return;
  prodotti = prodotti.filter(function(x) { return x.id !== id; });
  saveData('prodotti', prodotti);
  renderProdotti();
  updateDashStats();
  showToast('Prodotto eliminato', 'error');
}

// ============ CLIENTI CRUD ============
function renderClienti() {
  var search = (document.getElementById('clientiSearch').value || '').toLowerCase();
  var filtered = clienti.filter(function(c) {
    return !search || c.nome.toLowerCase().includes(search) || (c.azienda || '').toLowerCase().includes(search) || c.email.toLowerCase().includes(search);
  });

  var tbody = document.getElementById('clientiTable');
  var empty = document.getElementById('clientiEmpty');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = filtered.map(function(c) {
    return '<tr>' +
      '<td><strong>' + c.nome + '</strong></td>' +
      '<td>' + (c.azienda || '—') + '</td>' +
      '<td><a href="mailto:' + c.email + '" style="color:var(--arancione);">' + c.email + '</a></td>' +
      '<td>' + (c.telefono || '—') + '</td>' +
      '<td>' + statoBadge(c.tipo) + '</td>' +
      '<td><div class="admin-actions">' +
        '<button class="admin-action-btn" onclick="editCliente(' + c.id + ')" title="Modifica"><i class="fas fa-edit"></i></button>' +
        '<button class="admin-action-btn delete" onclick="deleteCliente(' + c.id + ')" title="Elimina"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
  }).join('');
}

function openClienteForm() {
  document.getElementById('clienteFormPanel').style.display = 'block';
  document.getElementById('clienteFormTitle').textContent = 'Nuovo Cliente';
  document.getElementById('clienteForm').reset();
  document.getElementById('clienteId').value = '';
  document.getElementById('clienteFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeClienteForm() {
  document.getElementById('clienteFormPanel').style.display = 'none';
}

function editCliente(id) {
  var c = clienti.find(function(x) { return x.id === id; });
  if (!c) return;
  document.getElementById('clienteFormPanel').style.display = 'block';
  document.getElementById('clienteFormTitle').textContent = 'Modifica Cliente';
  document.getElementById('clienteId').value = c.id;
  document.getElementById('clienteNome').value = c.nome;
  document.getElementById('clienteAzienda').value = c.azienda || '';
  document.getElementById('clienteEmail').value = c.email;
  document.getElementById('clienteTelefono').value = c.telefono || '';
  document.getElementById('clienteIndirizzo').value = c.indirizzo || '';
  document.getElementById('clientePiva').value = c.piva || '';
  document.getElementById('clienteTipo').value = c.tipo || 'Prospect';
  document.getElementById('clienteSettore').value = c.settore || '';
  document.getElementById('clienteNote').value = c.note || '';
  document.getElementById('clienteFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveCliente(e) {
  e.preventDefault();
  var id = document.getElementById('clienteId').value;
  var obj = {
    nome: document.getElementById('clienteNome').value,
    azienda: document.getElementById('clienteAzienda').value,
    email: document.getElementById('clienteEmail').value,
    telefono: document.getElementById('clienteTelefono').value,
    indirizzo: document.getElementById('clienteIndirizzo').value,
    piva: document.getElementById('clientePiva').value,
    tipo: document.getElementById('clienteTipo').value,
    settore: document.getElementById('clienteSettore').value,
    note: document.getElementById('clienteNote').value,
    data: todayISO()
  };

  if (id) {
    var idx = clienti.findIndex(function(x) { return x.id === parseInt(id); });
    if (idx > -1) { obj.id = parseInt(id); obj.data = clienti[idx].data; clienti[idx] = obj; }
    showToast('Cliente aggiornato con successo', 'success');
  } else {
    obj.id = nextId(clienti);
    clienti.push(obj);
    showToast('Cliente aggiunto con successo', 'success');
  }

  saveData('clienti', clienti);
  closeClienteForm();
  renderClienti();
  updateDashStats();
}

function deleteCliente(id) {
  if (!confirm('Eliminare questo cliente?')) return;
  clienti = clienti.filter(function(x) { return x.id !== id; });
  saveData('clienti', clienti);
  renderClienti();
  updateDashStats();
  showToast('Cliente eliminato', 'error');
}

// ============ BLOG CRUD ============
function renderBlog() {
  var filter = document.getElementById('blogFilter').value;
  var filtered = blog.filter(function(b) {
    return !filter || b.categoria === filter;
  });

  var tbody = document.getElementById('blogTable');
  var empty = document.getElementById('blogEmpty');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = filtered.map(function(b) {
    return '<tr>' +
      '<td><strong>' + b.titolo + '</strong></td>' +
      '<td>' + b.categoria + '</td>' +
      '<td>' + formatDate(b.data) + '</td>' +
      '<td>' + statoBadge(b.stato) + '</td>' +
      '<td><div class="admin-actions">' +
        '<button class="admin-action-btn" onclick="editBlog(' + b.id + ')" title="Modifica"><i class="fas fa-edit"></i></button>' +
        '<button class="admin-action-btn delete" onclick="deleteBlog(' + b.id + ')" title="Elimina"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
  }).join('');
}

function openBlogForm() {
  document.getElementById('blogFormPanel').style.display = 'block';
  document.getElementById('blogFormTitle').textContent = 'Nuovo Articolo';
  document.getElementById('blogForm').reset();
  document.getElementById('blogId').value = '';
  document.getElementById('blogContenuto').innerHTML = '<p>Scrivi qui il contenuto dell\'articolo...</p>';
  document.getElementById('blogFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeBlogForm() {
  document.getElementById('blogFormPanel').style.display = 'none';
}

function editBlog(id) {
  var b = blog.find(function(x) { return x.id === id; });
  if (!b) return;
  document.getElementById('blogFormPanel').style.display = 'block';
  document.getElementById('blogFormTitle').textContent = 'Modifica Articolo';
  document.getElementById('blogId').value = b.id;
  document.getElementById('blogTitolo').value = b.titolo;
  document.getElementById('blogSlug').value = b.slug || '';
  document.getElementById('blogCategoria').value = b.categoria;
  document.getElementById('blogStato').value = b.stato;
  document.getElementById('blogImmagine').value = b.immagine || '';
  document.getElementById('blogMeta').value = b.meta || '';
  document.getElementById('blogContenuto').innerHTML = b.contenuto || '<p>Scrivi qui il contenuto...</p>';
  document.getElementById('blogFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveBlog(e) {
  e.preventDefault();
  var id = document.getElementById('blogId').value;
  var titolo = document.getElementById('blogTitolo').value;
  var obj = {
    titolo: titolo,
    slug: document.getElementById('blogSlug').value || slugify(titolo),
    categoria: document.getElementById('blogCategoria').value,
    stato: document.getElementById('blogStato').value,
    immagine: document.getElementById('blogImmagine').value,
    meta: document.getElementById('blogMeta').value,
    contenuto: document.getElementById('blogContenuto').innerHTML,
    data: todayISO()
  };

  if (id) {
    var idx = blog.findIndex(function(x) { return x.id === parseInt(id); });
    if (idx > -1) { obj.id = parseInt(id); obj.data = blog[idx].data; blog[idx] = obj; }
    showToast('Articolo aggiornato con successo', 'success');
  } else {
    obj.id = nextId(blog);
    blog.push(obj);
    showToast('Articolo creato con successo', 'success');
  }

  saveData('blog', blog);
  closeBlogForm();
  renderBlog();
  updateDashStats();
}

function deleteBlog(id) {
  if (!confirm('Eliminare questo articolo?')) return;
  blog = blog.filter(function(x) { return x.id !== id; });
  saveData('blog', blog);
  renderBlog();
  updateDashStats();
  showToast('Articolo eliminato', 'error');
}

// Auto-slug
var blogTitoloInput = document.getElementById('blogTitolo');
if (blogTitoloInput) {
  blogTitoloInput.addEventListener('input', function() {
    var slugField = document.getElementById('blogSlug');
    if (!document.getElementById('blogId').value) {
      slugField.value = slugify(this.value);
    }
  });
}

// ============ MESSAGGI ============
function renderMessaggi() {
  var nuovi = messaggi.filter(function(m) { return m.stato === 'Nuovo'; }).length;
  document.getElementById('messaggiCount').textContent = messaggi.length + ' totali — ' + nuovi + ' da rispondere';

  document.getElementById('messaggiTable').innerHTML = messaggi.map(function(m) {
    return '<tr>' +
      '<td>' + formatDate(m.data) + '</td>' +
      '<td>' + m.nome + '</td>' +
      '<td>' + (m.azienda || '—') + '</td>' +
      '<td>' + m.servizio + '</td>' +
      '<td>' + statoBadge(m.stato) + '</td>' +
      '<td><div class="admin-actions">' +
        '<button class="admin-action-btn" onclick="toggleMessaggioStato(' + m.id + ')" title="Cambia stato"><i class="fas fa-exchange-alt"></i></button>' +
        '<button class="admin-action-btn delete" onclick="deleteMessaggio(' + m.id + ')" title="Elimina"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
  }).join('');
}

function toggleMessaggioStato(id) {
  var m = messaggi.find(function(x) { return x.id === id; });
  if (!m) return;
  var stati = ['Nuovo', 'In lavorazione', 'Risposto'];
  var idx = stati.indexOf(m.stato);
  m.stato = stati[(idx + 1) % stati.length];
  saveData('messaggi', messaggi);
  renderMessaggi();
  showToast('Stato aggiornato: ' + m.stato, 'success');
}

function deleteMessaggio(id) {
  if (!confirm('Eliminare questo messaggio?')) return;
  messaggi = messaggi.filter(function(x) { return x.id !== id; });
  saveData('messaggi', messaggi);
  renderMessaggi();
  updateDashStats();
  showToast('Messaggio eliminato', 'error');
}

// ============ EDITOR HELPERS ============
function execCmd(cmd, value) {
  if (cmd === 'formatBlock') {
    document.execCommand('formatBlock', false, '<' + value + '>');
  } else {
    document.execCommand(cmd, false, null);
  }
}

function insertLink() {
  var url = prompt('URL del link:');
  if (url) document.execCommand('createLink', false, url);
}

function insertImage() {
  var url = prompt('URL dell\'immagine:');
  if (url) document.execCommand('insertImage', false, url);
}

// Legacy editor open (for landing pages)
function openEditor(type) {
  alert('Editor per ' + type + ' — in fase di sviluppo');
}

// ============ UPDATE DASHBOARD STATS ============
function updateDashStats() {
  var statProd = document.getElementById('statProdotti');
  var statArt = document.getElementById('statArticoli');
  var statCli = document.getElementById('statClienti');
  var statMsg = document.getElementById('statMessaggi');
  if (statProd) statProd.textContent = prodotti.filter(function(p) { return p.stato === 'Attivo'; }).length;
  if (statArt) statArt.textContent = blog.length;
  if (statCli) statCli.textContent = clienti.length;
  if (statMsg) statMsg.textContent = messaggi.length;
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
  if (sessionStorage.getItem('crono_auth') === '1') {
    initDashboard();
  }
});

// Init immediately if DOM already loaded
if (document.readyState !== 'loading') {
  if (sessionStorage.getItem('crono_auth') === '1') {
    initDashboard();
  }
}
