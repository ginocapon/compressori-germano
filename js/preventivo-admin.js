/* Offerte interne a blocchi — solo admin */
(function () {
  var C = window.CronoCatalogo;
  if (!C) return;

  var offerta = emptyOfferta();
  var pickerTimer = null;

  function $(id) { return document.getElementById(id); }

  function emptyOfferta() {
    return {
      id: null,
      numero: '',
      titolo: '',
      data: new Date().toISOString().slice(0, 10),
      clienteId: '',
      clienteNome: '',
      clienteAzienda: '',
      clientePiva: '',
      clienteEmail: '',
      clienteIndirizzo: '',
      intro: '',
      scontoGlobale: 0,
      ivaPerc: C.IVA_DEFAULT,
      blocchi: []
    };
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getClienti() {
    if (typeof clienti !== 'undefined' && Array.isArray(clienti)) return clienti;
    try {
      var stored = localStorage.getItem('crono_clienti');
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return [];
  }

  function migrate(p) {
    if (!p) return emptyOfferta();
    if (p.blocchi && p.blocchi.length) return p;
    var blocchi = [];
    if (p.relazione) {
      blocchi.push({ id: C.uid(), type: 'testo', titolo: 'Relazione', testo: p.relazione });
    }
    (p.righe || []).forEach(function (r) {
      blocchi.push({
        id: C.uid(),
        type: 'articolo',
        codice: r.codice || '',
        nome: r.nome || '',
        qty: r.qty || 1,
        prezzo: r.prezzo || 0,
        sconto: r.sconto || 0,
        unita: r.unita || 'pz',
        testoSopra: '',
        testoSotto: '',
        foto: r.foto || ''
      });
    });
    p.blocchi = blocchi;
    p.titolo = p.titolo || '';
    p.intro = p.intro || p.relazione || '';
    return p;
  }

  function fillClientiSelect() {
    var sel = $('offCliente');
    if (!sel) return;
    var keep = sel.value;
    sel.innerHTML = '<option value="">— Seleziona dal CRM —</option>';
    getClienti().forEach(function (c) {
      var o = document.createElement('option');
      o.value = String(c.id);
      o.textContent = (c.azienda || c.nome || 'Cliente') + (c.nome && c.azienda ? ' — ' + c.nome : '');
      sel.appendChild(o);
    });
    if (keep) sel.value = keep;
  }

  function applyCliente(id) {
    var c = getClienti().find(function (x) { return String(x.id) === String(id); });
    if (!c) return;
    offerta.clienteId = c.id;
    offerta.clienteNome = c.nome || '';
    offerta.clienteAzienda = c.azienda || '';
    offerta.clientePiva = c.piva || '';
    offerta.clienteEmail = c.email || '';
    offerta.clienteIndirizzo = c.indirizzo || '';
    $('offNome').value = offerta.clienteNome;
    $('offAzienda').value = offerta.clienteAzienda;
    $('offPiva').value = offerta.clientePiva;
    $('offEmail').value = offerta.clienteEmail;
    $('offIndirizzo').value = offerta.clienteIndirizzo;
  }

  function syncHeader() {
    offerta.titolo = $('offTitolo').value;
    offerta.data = $('offData').value || offerta.data;
    offerta.clienteId = $('offCliente').value;
    offerta.clienteNome = $('offNome').value;
    offerta.clienteAzienda = $('offAzienda').value;
    offerta.clientePiva = $('offPiva').value;
    offerta.clienteEmail = $('offEmail').value;
    offerta.clienteIndirizzo = $('offIndirizzo').value;
    offerta.intro = $('offIntro').value;
    offerta.scontoGlobale = C.parseNumber($('offSconto').value);
    offerta.ivaPerc = C.parseNumber($('offIva').value);
  }

  function fillHeader() {
    $('offTitolo').value = offerta.titolo || '';
    $('offData').value = (offerta.data || '').slice(0, 10);
    fillClientiSelect();
    $('offCliente').value = offerta.clienteId ? String(offerta.clienteId) : '';
    $('offNome').value = offerta.clienteNome || '';
    $('offAzienda').value = offerta.clienteAzienda || '';
    $('offPiva').value = offerta.clientePiva || '';
    $('offEmail').value = offerta.clienteEmail || '';
    $('offIndirizzo').value = offerta.clienteIndirizzo || '';
    $('offIntro').value = offerta.intro || '';
    $('offSconto').value = offerta.scontoGlobale || 0;
    $('offIva').value = offerta.ivaPerc == null ? C.IVA_DEFAULT : offerta.ivaPerc;
    $('offHeading').textContent = offerta.numero ? offerta.numero : 'Nuova offerta';
  }

  function showList() {
    $('offComposer').hidden = true;
    $('prevListBar').hidden = false;
    $('prevHint').hidden = false;
    $('prevListCard').hidden = false;
    renderLista();
  }

  function showComposer() {
    $('offComposer').hidden = false;
    $('prevListBar').hidden = true;
    $('prevHint').hidden = true;
    $('prevListCard').hidden = true;
    fillHeader();
    renderPuzzle();
    updateTotals();
    $('offComposer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderLista() {
    C.loadPreventivi(true).then(function (rows) {
      var tbody = $('prevTable');
      var empty = $('prevEmpty');
      if (!tbody) return;
      if (!rows.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      tbody.innerHTML = rows.map(function (p) {
        var nBlocchi = p.blocchi ? p.blocchi.length : (p.righe ? p.righe.length : 0);
        return '<tr>' +
          '<td><strong>' + esc(p.numero || '—') + '</strong></td>' +
          '<td>' + esc(p.titolo || '—') + '</td>' +
          '<td>' + esc(p.clienteAzienda || p.clienteNome || '—') + '</td>' +
          '<td>' + esc((p.data || '').slice(0, 10)) + '</td>' +
          '<td>' + nBlocchi + '</td>' +
          '<td>' + C.euro(p.totale) + '</td>' +
          '<td><div class="admin-actions">' +
            '<button class="admin-action-btn" type="button" onclick="apriOfferta(' + p.id + ')" title="Apri"><i class="fas fa-folder-open"></i></button>' +
            '<button class="admin-action-btn" type="button" onclick="stampaOffertaId(' + p.id + ')" title="Stampa"><i class="fas fa-print"></i></button>' +
            '<button class="admin-action-btn delete" type="button" onclick="eliminaOfferta(' + p.id + ')" title="Elimina"><i class="fas fa-trash"></i></button>' +
          '</div></td></tr>';
      }).join('');
    });
  }

  function findBlock(id) {
    return (offerta.blocchi || []).find(function (b) { return b.id === id; });
  }

  function indexOfBlock(id) {
    return (offerta.blocchi || []).findIndex(function (b) { return b.id === id; });
  }

  function blockHtml(b, i, n) {
    var up = i === 0 ? ' disabled' : '';
    var down = i === n - 1 ? ' disabled' : '';
    var tools = '<div class="off-block-tools">' +
      '<button type="button" data-act="up"' + up + ' title="Su"><i class="fas fa-arrow-up"></i></button>' +
      '<button type="button" data-act="down"' + down + ' title="Giù"><i class="fas fa-arrow-down"></i></button>' +
      '<button type="button" data-act="del" title="Elimina"><i class="fas fa-trash"></i></button>' +
      '</div>';
    if (b.type === 'testo') {
      return '<article class="off-block off-block-testo" data-bid="' + b.id + '">' +
        '<header><span class="off-chip">Testo</span>' + tools + '</header>' +
        '<input data-f="titolo" placeholder="Titolo sezione" value="' + esc(b.titolo) + '">' +
        '<textarea data-f="testo" rows="4" placeholder="Descrizione lavori, condizioni, note...">' + esc(b.testo) + '</textarea>' +
        '</article>';
    }
    if (b.type === 'foto') {
      return '<article class="off-block off-block-foto" data-bid="' + b.id + '">' +
        '<header><span class="off-chip">Foto</span>' + tools + '</header>' +
        '<input data-f="titolo" placeholder="Didascalia" value="' + esc(b.titolo) + '">' +
        (b.foto ? '<img src="' + b.foto + '" alt="">' : '<p class="off-muted">Nessuna foto. Caricala qui sotto.</p>') +
        '<input type="file" accept="image/*" data-foto="1">' +
        '<textarea data-f="testo" rows="2" placeholder="Nota sotto la foto">' + esc(b.testo) + '</textarea>' +
        '</article>';
    }
    return '<article class="off-block off-block-art" data-bid="' + b.id + '">' +
      '<header><span class="off-chip">Articolo</span><code>' + esc(b.codice || 'LIBERO') + '</code>' + tools + '</header>' +
      '<textarea data-f="testoSopra" rows="2" placeholder="Testo sopra l\'articolo (opzionale)">' + esc(b.testoSopra) + '</textarea>' +
      '<input data-f="nome" placeholder="Nome articolo" value="' + esc(b.nome) + '">' +
      '<div class="off-art-grid">' +
        '<label>Q.tà<input type="number" min="0" step="0.01" data-f="qty" value="' + (b.qty || 1) + '"></label>' +
        '<label>Prezzo €<input type="number" min="0" step="0.01" data-f="prezzo" value="' + (b.prezzo || 0) + '"></label>' +
        '<label>Sconto %<input type="number" min="0" max="100" step="0.5" data-f="sconto" value="' + (b.sconto || 0) + '"></label>' +
        '<div class="off-art-tot">' + C.euro(C.lineTotale(b)) + '</div>' +
      '</div>' +
      (b.foto ? '<img class="off-art-img" src="' + b.foto + '" alt="">' : '') +
      '<label class="off-file">Foto articolo<input type="file" accept="image/*" data-foto="1"></label>' +
      '<textarea data-f="testoSotto" rows="2" placeholder="Testo sotto l\'articolo (opzionale)">' + esc(b.testoSotto) + '</textarea>' +
      '<div class="off-insert">' +
        '<button type="button" data-act="add-testo-above">+ Testo sopra</button>' +
        '<button type="button" data-act="add-testo-below">+ Testo sotto</button>' +
        '<button type="button" data-act="add-foto-above">+ Foto sopra</button>' +
        '<button type="button" data-act="add-foto-below">+ Foto sotto</button>' +
      '</div></article>';
  }

  function renderPuzzle() {
    var box = $('offPuzzle');
    if (!box) return;
    var list = offerta.blocchi || [];
    if (!list.length) {
      box.innerHTML = '<p class="off-empty">Puzzle vuoto. Aggiungi un articolo dal magazzino, un testo o una foto. Puoi inserire blocchi sopra e sotto ogni voce.</p>';
      return;
    }
    box.innerHTML = list.map(function (b, i) { return blockHtml(b, i, list.length); }).join('');
  }

  function updateTotals() {
    syncHeader();
    var calc = C.calcolaPreventivo(offerta);
    var el = $('offTotals');
    if (el) el.textContent = 'Imponibile ' + C.euro(calc.netto) + ' · Totale ' + C.euro(calc.totale);
    document.querySelectorAll('.off-block-art').forEach(function (card) {
      var b = findBlock(card.getAttribute('data-bid'));
      var tot = card.querySelector('.off-art-tot');
      if (b && tot) tot.textContent = C.euro(C.lineTotale(b));
    });
  }

  function newTesto() {
    return { id: C.uid(), type: 'testo', titolo: '', testo: '' };
  }

  function newFoto() {
    return { id: C.uid(), type: 'foto', titolo: '', testo: '', foto: '' };
  }

  function insertAt(index, block) {
    if (index < 0) index = 0;
    if (index > offerta.blocchi.length) index = offerta.blocchi.length;
    offerta.blocchi.splice(index, 0, block);
    renderPuzzle();
    updateTotals();
  }

  function addArticoloFromMag(art) {
    offerta.blocchi.push({
      id: C.uid(),
      type: 'articolo',
      codice: art.codice,
      nome: art.nome,
      qty: 1,
      prezzo: art.prezzo,
      sconto: 0,
      unita: art.unita || 'pz',
      testoSopra: '',
      testoSotto: art.descrizione || '',
      foto: art.foto || ''
    });
    renderPuzzle();
    updateTotals();
  }

  window.nuovaOfferta = function () {
    offerta = emptyOfferta();
    showComposer();
  };

  window.chiudiOfferta = function () {
    showList();
  };

  window.apriOfferta = function (id) {
    C.getPreventivo(Number(id)).then(function (p) {
      if (!p) return;
      offerta = migrate(p);
      showComposer();
    });
  };

  window.eliminaOfferta = function (id) {
    if (!confirm('Eliminare questa offerta?')) return;
    C.deletePreventivo(id).then(function () {
      renderLista();
      if (typeof showToast === 'function') showToast('Offerta eliminata', 'error');
    });
  };

  window.salvaOfferta = function () {
    syncHeader();
    var go = function () {
      return C.savePreventivo(offerta).then(function (saved) {
        offerta = saved;
        $('offHeading').textContent = saved.numero;
        if (typeof showToast === 'function') showToast('Offerta ' + saved.numero + ' salvata', 'success');
        else alert('Offerta ' + saved.numero + ' salvata');
      });
    };
    if (offerta.numero) return go();
    return C.nextNumero().then(function (num) {
      offerta.numero = num;
      return go();
    });
  };

  window.aggiungiBloccoTesto = function () {
    insertAt(offerta.blocchi.length, newTesto());
  };

  window.aggiungiBloccoFoto = function () {
    insertAt(offerta.blocchi.length, newFoto());
  };

  window.aggiungiVoceLibera = function () {
    insertAt(offerta.blocchi.length, {
      id: C.uid(),
      type: 'articolo',
      codice: '',
      nome: '',
      qty: 1,
      prezzo: 0,
      sconto: 0,
      unita: 'pz',
      testoSopra: '',
      testoSotto: '',
      foto: ''
    });
  };

  window.apriPickerArticolo = function () {
    $('artPicker').hidden = false;
    $('artPickerQ').value = '';
    $('artPickerQ').focus();
    renderPicker('');
  };

  window.chiudiPickerArticolo = function () {
    $('artPicker').hidden = true;
  };

  function renderPicker(q) {
    C.searchArticoli({ q: q, page: 1, pageSize: 40 }).then(function (res) {
      var box = $('artPickerList');
      if (!res.rows.length) {
        box.innerHTML = '<p class="off-muted">Nessun articolo. Caricali da Magazzino.</p>';
        return;
      }
      box.innerHTML = res.rows.map(function (a) {
        var stock = a.giacenza <= 0 ? 'Esaurito' : a.giacenza + ' ' + (a.unita || 'pz');
        return '<button type="button" class="off-pick-row" data-codice="' + esc(a.codice) + '">' +
          (a.foto ? '<img src="' + a.foto + '" alt="">' : '<span class="off-pick-ph"></span>') +
          '<span><code>' + esc(a.codice) + '</code><strong>' + esc(a.nome) + '</strong><small>' + esc(a.categoria) + ' · ' + C.euro(a.prezzo) + ' · ' + stock + '</small></span>' +
          '</button>';
      }).join('');
    });
  }

  function printHtml(p) {
    p = migrate(p);
    var calc = C.calcolaPreventivo(p);
    var blocks = (p.blocchi || []).map(function (b) {
      if (b.type === 'testo') {
        return '<section class="blk">' + (b.titolo ? '<h3>' + esc(b.titolo) + '</h3>' : '') +
          '<div class="txt">' + esc(b.testo).replace(/\n/g, '<br>') + '</div></section>';
      }
      if (b.type === 'foto') {
        return '<section class="blk">' + (b.titolo ? '<h3>' + esc(b.titolo) + '</h3>' : '') +
          (b.foto ? '<img src="' + b.foto + '" alt="">' : '') +
          (b.testo ? '<p>' + esc(b.testo).replace(/\n/g, '<br>') + '</p>' : '') +
          '</section>';
      }
      return '<section class="blk art">' +
        (b.testoSopra ? '<div class="txt">' + esc(b.testoSopra).replace(/\n/g, '<br>') + '</div>' : '') +
        (b.foto ? '<img src="' + b.foto + '" alt="">' : '') +
        '<table><tr><td>' + esc(b.codice || '') + '</td><td>' + esc(b.nome) + '</td><td>' + (b.qty || 0) + '</td><td>' + C.euro(b.prezzo) + '</td><td>' + (b.sconto || 0) + '%</td><td>' + C.euro(C.lineTotale(b)) + '</td></tr></table>' +
        (b.testoSotto ? '<div class="txt">' + esc(b.testoSotto).replace(/\n/g, '<br>') + '</div>' : '') +
        '</section>';
    }).join('');
    return '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>' + esc(p.numero || 'Offerta') + '</title>' +
      '<style>body{font-family:Inter,Arial,sans-serif;color:#1a1a1a;padding:32px;max-width:860px;margin:auto}h1{font-size:22px;margin:0 0 8px}h2{font-size:16px;margin:24px 0 8px}h3{font-size:15px;margin:0 0 8px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:13px}img{max-width:100%;height:auto;margin:8px 0;border-radius:6px}.txt{white-space:pre-wrap;margin:8px 0;line-height:1.5}.blk{margin:20px 0;padding:12px 0;border-bottom:1px solid #eee}.tot{text-align:right;margin-top:24px}</style></head><body>' +
      '<h1>Crono Service — ' + esc(p.titolo || ('Offerta ' + (p.numero || ''))) + '</h1>' +
      '<p>Via dell\'Industria 42, 35100 Padova · 049 000 1111 · info@cronoservice.demo</p>' +
      '<p><strong>' + esc(p.numero || '') + '</strong> · Data ' + esc((p.data || '').slice(0, 10)) + '</p>' +
      '<p><strong>Cliente:</strong> ' + esc(p.clienteAzienda || p.clienteNome || '—') + '<br>' +
      (p.clienteNome ? esc(p.clienteNome) + '<br>' : '') +
      (p.clienteIndirizzo ? esc(p.clienteIndirizzo) + '<br>' : '') +
      (p.clientePiva ? 'P.IVA ' + esc(p.clientePiva) + '<br>' : '') +
      (p.clienteEmail ? esc(p.clienteEmail) : '') + '</p>' +
      (p.intro ? '<h2>Descrizione dell\'offerta</h2><div class="txt">' + esc(p.intro).replace(/\n/g, '<br>') + '</div>' : '') +
      blocks +
      '<p class="tot">Sconto globale: ' + (p.scontoGlobale || 0) + '%<br>Imponibile: ' + C.euro(calc.netto) + '<br>IVA ' + calc.ivaPerc + '%: ' + C.euro(calc.iva) + '<br><strong>Totale: ' + C.euro(calc.totale) + '</strong></p>' +
      '<p style="margin-top:40px;font-size:12px;color:#666">Documento interno di offerta — validità 30 giorni salvo diversa indicazione. Prezzi al netto di eventuali oneri di trasporto e installazione.</p>' +
      '</body></html>';
  }

  function openPrint(html) {
    var win = window.open('', '_blank');
    if (!win) {
      alert('Consenti i popup per stampare.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 250);
  }

  window.stampaOfferta = function () {
    syncHeader();
    openPrint(printHtml(offerta));
  };

  window.stampaOffertaId = function (id) {
    C.getPreventivo(Number(id)).then(function (p) {
      if (p) openPrint(printHtml(p));
    });
  };

  function bind() {
    var puzzle = $('offPuzzle');
    if (!puzzle) return;

    ['offTitolo', 'offData', 'offNome', 'offAzienda', 'offPiva', 'offEmail', 'offIndirizzo', 'offIntro', 'offSconto', 'offIva'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', updateTotals);
    });
    $('offCliente').addEventListener('change', function () {
      applyCliente(this.value);
      updateTotals();
    });

    puzzle.addEventListener('input', function (e) {
      var card = e.target.closest('[data-bid]');
      if (!card) return;
      var b = findBlock(card.getAttribute('data-bid'));
      var f = e.target.getAttribute('data-f');
      if (!b || !f) return;
      if (e.target.type === 'number') b[f] = C.parseNumber(e.target.value);
      else b[f] = e.target.value;
      if (f === 'qty' || f === 'prezzo' || f === 'sconto') updateTotals();
    });

    puzzle.addEventListener('change', function (e) {
      var inp = e.target.closest('input[type="file"][data-foto]');
      if (!inp || !inp.files || !inp.files[0]) return;
      var card = inp.closest('[data-bid]');
      var b = findBlock(card.getAttribute('data-bid'));
      if (!b) return;
      C.compressImage(inp.files[0], 900, 0.72).then(function (data) {
        b.foto = data;
        renderPuzzle();
      });
    });

    puzzle.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var card = btn.closest('[data-bid]');
      if (!card) return;
      var id = card.getAttribute('data-bid');
      var i = indexOfBlock(id);
      if (i < 0) return;
      var act = btn.getAttribute('data-act');
      if (act === 'del') offerta.blocchi.splice(i, 1);
      if (act === 'up' && i > 0) {
        var tmp = offerta.blocchi[i - 1];
        offerta.blocchi[i - 1] = offerta.blocchi[i];
        offerta.blocchi[i] = tmp;
      }
      if (act === 'down' && i < offerta.blocchi.length - 1) {
        var tmp2 = offerta.blocchi[i + 1];
        offerta.blocchi[i + 1] = offerta.blocchi[i];
        offerta.blocchi[i] = tmp2;
      }
      if (act === 'add-testo-above') return insertAt(i, newTesto());
      if (act === 'add-testo-below') return insertAt(i + 1, newTesto());
      if (act === 'add-foto-above') return insertAt(i, newFoto());
      if (act === 'add-foto-below') return insertAt(i + 1, newFoto());
      renderPuzzle();
      updateTotals();
    });

    $('artPickerList').addEventListener('click', function (e) {
      var row = e.target.closest('[data-codice]');
      if (!row) return;
      var codice = row.getAttribute('data-codice');
      C.loadArticoli().then(function (rows) {
        var a = rows.find(function (x) { return x.codice === codice; });
        if (a) addArticoloFromMag(a);
        chiudiPickerArticolo();
      });
    });

    $('artPickerQ').addEventListener('input', function () {
      var q = this.value;
      clearTimeout(pickerTimer);
      pickerTimer = setTimeout(function () { renderPicker(q); }, 120);
    });

    $('artPicker').addEventListener('click', function (e) {
      if (e.target === $('artPicker')) chiudiPickerArticolo();
    });
  }

  function boot() {
    bind();
    C.ensureSeed().then(function () { renderLista(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
