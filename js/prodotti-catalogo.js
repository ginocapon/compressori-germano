/* Catalogo magazzino + preventivatore sulla pagina prodotti */
(function () {
  var C = window.CronoCatalogo;
  if (!C) return;

  var state = { q: '', categoria: '', page: 1, soloDisponibili: false };
  var quote = emptyQuote();

  function emptyQuote() {
    return {
      id: null,
      numero: '',
      data: new Date().toISOString().slice(0, 10),
      clienteNome: '',
      clienteAzienda: '',
      clientePiva: '',
      clienteEmail: '',
      scontoGlobale: 0,
      ivaPerc: C.IVA_DEFAULT,
      relazione: '',
      righe: []
    };
  }

  function $(id) { return document.getElementById(id); }

  function stockLabel(n) {
    if (n <= 0) return '<span class="stock-badge out">Esaurito</span>';
    if (n < 5) return '<span class="stock-badge low">' + n + ' in stock</span>';
    return '<span class="stock-badge ok">' + n + ' disp.</span>';
  }

  function fillCats() {
    var sel = $('catSearch');
    if (!sel) return;
    C.CATEGORIE.forEach(function (cat) {
      var o = document.createElement('option');
      o.value = cat;
      o.textContent = cat;
      sel.appendChild(o);
    });
  }

  function renderCatalogo() {
    C.searchArticoli({
      q: state.q,
      categoria: state.categoria,
      soloDisponibili: state.soloDisponibili,
      page: state.page,
      pageSize: 50
    }).then(function (res) {
      if (res.page > res.pages) { state.page = res.pages; return renderCatalogo(); }
      var tbody = $('catalogoBody');
      var meta = $('catalogoMeta');
      if (meta) meta.textContent = res.total + ' articoli · pag. ' + res.page + '/' + res.pages;
      if (!res.rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="catalogo-empty">Nessun articolo. Carica il CSV da Admin → Magazzino.</td></tr>';
      } else {
        tbody.innerHTML = res.rows.map(function (a) {
          var disabled = a.giacenza <= 0 ? ' disabled' : '';
          return '<tr class="cat-row" data-codice="' + a.codice + '">' +
            '<td><code>' + a.codice + '</code></td>' +
            '<td><strong>' + a.nome + '</strong><div class="cat-desc">' + (a.descrizione || '') + '</div></td>' +
            '<td>' + a.categoria + '</td>' +
            '<td>' + C.euro(a.prezzo) + '</td>' +
            '<td>' + stockLabel(a.giacenza) + '</td>' +
            '<td><button class="btn btn-primary btn-add" data-add="' + a.codice + '"' + disabled + '>+ Preventivo</button></td>' +
            '</tr>';
        }).join('');
      }
      var pager = $('catalogoPager');
      pager.innerHTML =
        '<button type="button" class="btn btn-outline"' + (res.page <= 1 ? ' disabled' : '') + ' data-page="' + (res.page - 1) + '">Prec</button>' +
        '<button type="button" class="btn btn-outline"' + (res.page >= res.pages ? ' disabled' : '') + ' data-page="' + (res.page + 1) + '">Succ</button>';
    });
  }

  function addByCodice(codice, qty) {
    C.loadArticoli().then(function (rows) {
      var a = rows.find(function (x) { return x.codice === codice; });
      if (!a) return;
      var existing = quote.righe.find(function (r) { return r.codice === codice; });
      if (existing) existing.qty = Number(existing.qty) + (qty || 1);
      else {
        quote.righe.push({
          codice: a.codice,
          nome: a.nome,
          qty: qty || 1,
          prezzo: a.prezzo,
          sconto: 0,
          unita: a.unita
        });
      }
      renderQuote();
      openQuote();
    });
  }

  function renderQuote() {
    var calc = C.calcolaPreventivo(quote);
    quote.righe = calc.righe;
    var body = $('quoteLines');
    if (!quote.righe.length) {
      body.innerHTML = '<p class="quote-empty">Clicca un articolo per aggiungerlo in pochi secondi.</p>';
    } else {
      body.innerHTML = quote.righe.map(function (r, i) {
        return '<div class="quote-line" data-i="' + i + '">' +
          '<div class="quote-line-top"><code>' + r.codice + '</code> <span>' + r.nome + '</span>' +
          '<button type="button" class="quote-del" data-del="' + i + '" aria-label="Rimuovi">&times;</button></div>' +
          '<div class="quote-line-grid">' +
            '<label>Q.tà<input type="number" min="1" step="1" value="' + r.qty + '" data-f="qty" data-i="' + i + '"></label>' +
            '<label>Prezzo €<input type="number" min="0" step="0.01" value="' + r.prezzo + '" data-f="prezzo" data-i="' + i + '"></label>' +
            '<label>Sconto %<input type="number" min="0" max="100" step="0.5" value="' + r.sconto + '" data-f="sconto" data-i="' + i + '"></label>' +
            '<div class="quote-line-tot">' + C.euro(r.totale) + '</div>' +
          '</div></div>';
      }).join('');
    }
    $('quoteCount').textContent = quote.righe.length;
    $('quoteNetto').textContent = C.euro(calc.netto);
    $('quoteIva').textContent = C.euro(calc.iva);
    $('quoteTotale').textContent = C.euro(calc.totale);
    $('quoteNumero').textContent = quote.numero || 'Nuovo';
  }

  function openQuote() {
    var panel = $('quotePanel');
    if (panel) panel.classList.add('open');
    var bar = document.getElementById('mobileCta');
    if (bar) bar.style.display = 'none';
  }

  function closeQuote() {
    var panel = $('quotePanel');
    if (panel) panel.classList.remove('open');
    var bar = document.getElementById('mobileCta');
    if (bar) bar.style.display = '';
  }

  function syncHeader() {
    quote.clienteNome = $('qNome').value;
    quote.clienteAzienda = $('qAzienda').value;
    quote.clientePiva = $('qPiva').value;
    quote.clienteEmail = $('qEmail').value;
    quote.scontoGlobale = C.parseNumber($('qScontoGlobale').value);
    quote.ivaPerc = C.parseNumber($('qIva').value);
    quote.relazione = $('qRelazione').value;
    quote.data = $('qData').value || quote.data;
  }

  function saveQuote() {
    syncHeader();
    var go = function () {
      var calc = C.calcolaPreventivo(quote);
      Object.assign(quote, calc);
      return C.savePreventivo(quote).then(function (saved) {
        quote = saved;
        $('quoteNumero').textContent = saved.numero;
        renderQuote();
        alert('Preventivo ' + saved.numero + ' salvato.');
      });
    };
    if (quote.numero) return go();
    return C.nextNumero().then(function (num) {
      quote.numero = num;
      return go();
    });
  }

  function printQuote() {
    syncHeader();
    var calc = C.calcolaPreventivo(quote);
    var win = window.open('', '_blank');
    var righe = calc.righe.map(function (r) {
      return '<tr><td>' + r.codice + '</td><td>' + r.nome + '</td><td>' + r.qty + '</td><td>' + C.euro(r.prezzo) + '</td><td>' + r.sconto + '%</td><td>' + C.euro(r.totale) + '</td></tr>';
    }).join('');
    win.document.write('<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>' + (quote.numero || 'Preventivo') + '</title>' +
      '<style>body{font-family:Inter,Arial,sans-serif;color:#1a1a1a;padding:32px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:13px}th{background:#0B1D32;color:#fff}.tot{text-align:right} .rel{white-space:pre-wrap;border:1px solid #eee;padding:16px;margin-top:24px}</style></head><body>' +
      '<h1>Crono Service — Preventivo ' + (quote.numero || '') + '</h1>' +
      '<p>Via dell\'Industria 42, 35100 Padova · 049 000 1111 · info@cronoservice.demo</p>' +
      '<p><strong>Cliente:</strong> ' + (quote.clienteAzienda || quote.clienteNome || '—') + '<br>' +
      (quote.clienteNome ? quote.clienteNome + '<br>' : '') +
      (quote.clientePiva ? 'P.IVA ' + quote.clientePiva + '<br>' : '') +
      'Data: ' + quote.data + '</p>' +
      '<table><thead><tr><th>Codice</th><th>Articolo</th><th>Q.tà</th><th>Prezzo</th><th>Sconto</th><th>Totale</th></tr></thead><tbody>' + righe +
      '</tbody></table>' +
      '<p class="tot">Sconto globale: ' + (quote.scontoGlobale || 0) + '%<br>Imponibile: ' + C.euro(calc.netto) + '<br>IVA ' + calc.ivaPerc + '%: ' + C.euro(calc.iva) + '<br><strong>Totale: ' + C.euro(calc.totale) + '</strong></p>' +
      (quote.relazione ? '<h2>Relazione tecnica / commerciale</h2><div class="rel">' + quote.relazione.replace(/</g, '&lt;') + '</div>' : '') +
      '<p style="margin-top:40px;font-size:12px;color:#666">Documento di preventivo — validità 30 giorni salvo diversa indicazione. Prezzi al netto di eventuali oneri di trasporto e installazione.</p>' +
      '</body></html>');
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 250);
  }

  function newQuote() {
    quote = emptyQuote();
    $('qNome').value = '';
    $('qAzienda').value = '';
    $('qPiva').value = '';
    $('qEmail').value = '';
    $('qScontoGlobale').value = 0;
    $('qIva').value = C.IVA_DEFAULT;
    $('qRelazione').value = '';
    $('qData').value = quote.data;
    renderQuote();
  }

  function boot() {
    fillCats();
    $('qData').value = quote.data;
    $('qIva').value = C.IVA_DEFAULT;
    var t;
    $('catQ').addEventListener('input', function () {
      clearTimeout(t);
      var val = this.value;
      t = setTimeout(function () { state.q = val; state.page = 1; renderCatalogo(); }, 100);
    });
    $('catQ').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        C.searchArticoli({ q: this.value, categoria: state.categoria, page: 1, pageSize: 1 }).then(function (res) {
          if (res.rows[0]) addByCodice(res.rows[0].codice, 1);
        });
      }
    });
    $('catSearch').addEventListener('change', function () {
      state.categoria = this.value;
      state.page = 1;
      renderCatalogo();
    });
    $('catStock').addEventListener('change', function () {
      state.soloDisponibili = this.checked;
      state.page = 1;
      renderCatalogo();
    });
    $('catalogoBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add]');
      if (btn) addByCodice(btn.getAttribute('data-add'), 1);
      var row = e.target.closest('tr[data-codice]');
      if (row && !btn) addByCodice(row.getAttribute('data-codice'), 1);
    });
    $('catalogoPager').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      state.page = Number(btn.getAttribute('data-page'));
      renderCatalogo();
    });
    $('quoteLines').addEventListener('input', function (e) {
      var input = e.target.closest('input[data-f]');
      if (!input) return;
      var i = Number(input.getAttribute('data-i'));
      var f = input.getAttribute('data-f');
      if (!quote.righe[i]) return;
      quote.righe[i][f] = C.parseNumber(input.value);
      if (f === 'qty' && quote.righe[i].qty < 1) quote.righe[i].qty = 1;
      renderQuote();
      var focus = document.querySelector('input[data-f="' + f + '"][data-i="' + i + '"]');
      if (focus) { focus.focus(); focus.selectionStart = focus.selectionEnd = focus.value.length; }
    });
    $('quoteLines').addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (!del) return;
      quote.righe.splice(Number(del.getAttribute('data-del')), 1);
      renderQuote();
    });
    ['qNome', 'qAzienda', 'qPiva', 'qEmail', 'qScontoGlobale', 'qIva', 'qRelazione', 'qData'].forEach(function (id) {
      $(id).addEventListener('input', function () { syncHeader(); renderQuote(); });
    });
    $('btnQuoteOpen').addEventListener('click', openQuote);
    $('btnQuoteClose').addEventListener('click', closeQuote);
    $('btnQuoteSave').addEventListener('click', saveQuote);
    $('btnQuotePrint').addEventListener('click', printQuote);
    $('btnQuoteNew').addEventListener('click', newQuote);

    C.ensureSeed().then(function () {
      renderCatalogo();
      renderQuote();
      var params = new URLSearchParams(location.search);
      var pid = params.get('preventivo');
      if (pid) {
        C.getPreventivo(Number(pid)).then(function (p) {
          if (!p) return;
          quote = p;
          $('qNome').value = p.clienteNome || '';
          $('qAzienda').value = p.clienteAzienda || '';
          $('qPiva').value = p.clientePiva || '';
          $('qEmail').value = p.clienteEmail || '';
          $('qScontoGlobale').value = p.scontoGlobale || 0;
          $('qIva').value = p.ivaPerc == null ? C.IVA_DEFAULT : p.ivaPerc;
          $('qRelazione').value = p.relazione || '';
          $('qData').value = (p.data || '').slice(0, 10);
          renderQuote();
          openQuote();
        });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
