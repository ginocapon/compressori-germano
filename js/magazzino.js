/* Admin Magazzino + Preventivi */
(function () {
  var C = window.CronoCatalogo;
  if (!C) return;

  var magState = { q: '', categoria: '', page: 1 };

  function $(id) { return document.getElementById(id); }

  function fillCategorie(selectId, withAll) {
    var sel = $(selectId);
    if (!sel) return;
    var keep = sel.value;
    sel.innerHTML = withAll ? '<option value="">Tutte le categorie</option>' : '<option value="">Seleziona...</option>';
    C.CATEGORIE.forEach(function (cat) {
      var o = document.createElement('option');
      o.value = cat;
      o.textContent = cat;
      sel.appendChild(o);
    });
    if (keep) sel.value = keep;
  }

  function stockBadge(n) {
    if (n <= 0) return '<span class="badge badge-error">Esaurito</span>';
    if (n < 5) return '<span class="badge badge-warning">' + n + ' pz</span>';
    return '<span class="badge badge-success">' + n + '</span>';
  }

  function renderMagazzino() {
    var q = ($('magSearch') && $('magSearch').value) || '';
    var cat = ($('magFilter') && $('magFilter').value) || '';
    magState.q = q;
    magState.categoria = cat;
    C.searchArticoli({ q: q, categoria: cat, page: magState.page, pageSize: 80 }).then(function (res) {
      if (res.page > res.pages) {
        magState.page = res.pages;
        return renderMagazzino();
      }
      var tbody = $('magTable');
      var empty = $('magEmpty');
      var info = $('magInfo');
      if (info) info.textContent = res.total + ' articoli';
      if (!res.rows.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
      } else {
        if (empty) empty.style.display = 'none';
        tbody.innerHTML = res.rows.map(function (a) {
          var thumb = a.foto
            ? '<img src="' + a.foto + '" alt="" class="off-thumb">'
            : '<span class="off-pick-ph"></span>';
          return '<tr>' +
            '<td>' + thumb + '</td>' +
            '<td><code>' + a.codice + '</code></td>' +
            '<td><strong>' + a.nome + '</strong></td>' +
            '<td>' + a.categoria + '</td>' +
            '<td>' + C.euro(a.prezzo) + '</td>' +
            '<td>' + stockBadge(a.giacenza) + ' <small>' + a.unita + '</small></td>' +
            '<td><div class="admin-actions">' +
              '<button class="admin-action-btn" onclick="editMagArticolo(\'' + a.codice.replace(/'/g, '\\\'') + '\')" title="Modifica"><i class="fas fa-edit"></i></button>' +
              '<button class="admin-action-btn delete" onclick="deleteMagArticolo(\'' + a.codice.replace(/'/g, '\\\'') + '\')" title="Elimina"><i class="fas fa-trash"></i></button>' +
            '</div></td></tr>';
        }).join('');
      }
      var pager = $('magPager');
      if (pager) {
        pager.innerHTML = '<button class="btn btn-outline" ' + (res.page <= 1 ? 'disabled' : '') + ' onclick="magPage(' + (res.page - 1) + ')">Prec</button>' +
          '<span>Pagina ' + res.page + ' / ' + res.pages + '</span>' +
          '<button class="btn btn-outline" ' + (res.page >= res.pages ? 'disabled' : '') + ' onclick="magPage(' + (res.page + 1) + ')">Succ</button>';
      }
      var stat = $('statMagazzino');
      if (stat) C.loadArticoli().then(function (all) { stat.textContent = all.length; });
    });
  }

  window.magPage = function (p) {
    magState.page = Math.max(1, p);
    renderMagazzino();
  };

  window.openMagForm = function () {
    $('magFormPanel').style.display = 'block';
    $('magFormTitle').textContent = 'Nuovo articolo';
    $('magForm').reset();
    $('magCodice').readOnly = false;
    clearMagFoto();
    $('magFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.closeMagForm = function () {
    $('magFormPanel').style.display = 'none';
  };

  window.editMagArticolo = function (codice) {
    C.loadArticoli().then(function (rows) {
      var a = rows.find(function (x) { return x.codice === codice; });
      if (!a) return;
      $('magFormPanel').style.display = 'block';
      $('magFormTitle').textContent = 'Modifica articolo';
      $('magCodice').value = a.codice;
      $('magCodice').readOnly = true;
      $('magNome').value = a.nome;
      $('magCategoria').value = a.categoria;
      $('magPrezzo').value = a.prezzo;
      $('magGiacenza').value = a.giacenza;
      $('magUnita').value = a.unita;
      $('magDescrizione').value = a.descrizione || '';
      setMagFoto(a.foto || '');
      $('magFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.saveMagArticolo = function (e) {
    e.preventDefault();
    var item = {
      codice: $('magCodice').value,
      nome: $('magNome').value,
      categoria: $('magCategoria').value,
      prezzo: $('magPrezzo').value,
      giacenza: $('magGiacenza').value,
      unita: $('magUnita').value,
      descrizione: $('magDescrizione').value,
      foto: ($('magFoto') && $('magFoto').value) || '',
      attivo: true
    };
    C.saveArticolo(item).then(function () {
      closeMagForm();
      renderMagazzino();
      if (typeof showToast === 'function') showToast('Articolo salvato', 'success');
    });
  };

  window.deleteMagArticolo = function (codice) {
    if (!confirm('Eliminare ' + codice + '?')) return;
    C.deleteArticolo(codice).then(function () {
      renderMagazzino();
      if (typeof showToast === 'function') showToast('Articolo eliminato', 'error');
    });
  };

  window.importMagCsv = function (input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var rows = C.parseCsv(String(reader.result || ''));
      if (!rows.length) {
        if (typeof showToast === 'function') showToast('CSV vuoto o non valido', 'error');
        input.value = '';
        return;
      }
      C.upsertArticoli(rows, false).then(function (all) {
        magState.page = 1;
        renderMagazzino();
        if (typeof showToast === 'function') showToast('Importati / aggiornati ' + rows.length + ' articoli. Totale: ' + all.length, 'success');
        input.value = '';
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  window.exportMagCsv = function () {
    C.loadArticoli().then(function (rows) {
      C.downloadText('ll-air-service-magazzino.csv', C.toCsv(rows), 'text/csv;charset=utf-8');
    });
  };

  window.downloadMagTemplate = function () {
    var sample = 'codice;nome;categoria;prezzo;giacenza;unita;descrizione\n' +
      'CMP-1000A;Compressore a vite 75;Compressori;12850,00;2;pz;Compressore lubrificato 75 kW\n' +
      'VIT-0042B;Kit revisione vite CS55;Viti e kit vite;1860,50;6;pz;Kit originale vite\n' +
      'TUB-0200C;Tubo alluminio 28 mm;Tubi e raccordi;18,90;120;m;Barra 6 metri\n';
    C.downloadText('modello-articoli.csv', sample, 'text/csv;charset=utf-8');
  };

  window.setMagFoto = function (data) {
    var hidden = $('magFoto');
    var preview = $('magFotoPreview');
    if (hidden) hidden.value = data || '';
    if (preview) {
      if (data) {
        preview.src = data;
        preview.hidden = false;
      } else {
        preview.removeAttribute('src');
        preview.hidden = true;
      }
    }
  };

  window.clearMagFoto = function () {
    setMagFoto('');
    var file = $('magFotoFile');
    if (file) file.value = '';
  };

  function boot() {
    fillCategorie('magFilter', true);
    fillCategorie('magCategoria', false);
    C.ensureSeed().then(function () {
      renderMagazzino();
    });
    var search = $('magSearch');
    var filter = $('magFilter');
    var t;
    if (search) search.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { magState.page = 1; renderMagazzino(); }, 120);
    });
    if (filter) filter.addEventListener('change', function () { magState.page = 1; renderMagazzino(); });
    var fotoFile = $('magFotoFile');
    if (fotoFile) {
      fotoFile.addEventListener('change', function () {
        if (!this.files || !this.files[0]) return;
        C.compressImage(this.files[0], 900, 0.72).then(function (data) {
          setMagFoto(data);
        });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
