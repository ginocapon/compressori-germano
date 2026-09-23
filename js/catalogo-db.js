/* Crono Service — catalogo magazzino + preventivi (IndexedDB) */
(function (global) {
  var DB_NAME = 'crono_catalogo';
  var DB_VERSION = 1;
  var PAGE_SIZE = 60;
  var IVA_DEFAULT = 22;
  var cacheArticoli = null;
  var cachePreventivi = null;

  var CATEGORIE = [
    'Compressori',
    'Viti e kit vite',
    'Pompe',
    'Tubi e raccordi',
    'Filtri',
    'Ricambi',
    'Lubrificanti',
    'Essiccatori',
    'Serbatoi',
    'Valvole'
  ];

  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('articoli')) {
          var art = db.createObjectStore('articoli', { keyPath: 'codice' });
          art.createIndex('categoria', 'categoria', { unique: false });
          art.createIndex('nome', 'nome', { unique: false });
        }
        if (!db.objectStoreNames.contains('preventivi')) {
          var prev = db.createObjectStore('preventivi', { keyPath: 'id', autoIncrement: true });
          prev.createIndex('data', 'data', { unique: false });
          prev.createIndex('numero', 'numero', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function txDone(tx) {
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  }

  function allFromStore(storeName) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function getMeta(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var req = db.transaction('meta', 'readonly').objectStore('meta').get(key);
        req.onsuccess = function () { resolve(req.result ? req.result.value : null); };
        req.onerror = function () { resolve(null); };
      });
    });
  }

  function setMeta(key, value) {
    return openDb().then(function (db) {
      var tx = db.transaction('meta', 'readwrite');
      tx.objectStore('meta').put({ key: key, value: value });
      return txDone(tx);
    });
  }

  function loadArticoli(force) {
    if (cacheArticoli && !force) return Promise.resolve(cacheArticoli);
    return allFromStore('articoli').then(function (rows) {
      cacheArticoli = rows;
      return rows;
    });
  }

  function loadPreventivi(force) {
    if (cachePreventivi && !force) return Promise.resolve(cachePreventivi);
    return allFromStore('preventivi').then(function (rows) {
      rows.sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); });
      cachePreventivi = rows;
      return rows;
    });
  }

  function upsertArticoli(list, replaceAll) {
    return openDb().then(function (db) {
      var tx = db.transaction('articoli', 'readwrite');
      var store = tx.objectStore('articoli');
      if (replaceAll) store.clear();
      list.forEach(function (item) {
        if (!item.codice) return;
        var n = normalizeArticolo(item);
        if (!replaceAll && !n.foto) {
          var req = store.get(n.codice);
          req.onsuccess = function () {
            if (req.result && req.result.foto) n.foto = req.result.foto;
            store.put(n);
          };
        } else {
          store.put(n);
        }
      });
      return txDone(tx).then(function () {
        cacheArticoli = null;
        return loadArticoli(true);
      });
    });
  }

  function saveArticolo(item) {
    return upsertArticoli([item], false);
  }

  function deleteArticolo(codice) {
    return openDb().then(function (db) {
      var tx = db.transaction('articoli', 'readwrite');
      tx.objectStore('articoli').delete(codice);
      return txDone(tx).then(function () {
        cacheArticoli = null;
        return loadArticoli(true);
      });
    });
  }

  function parseNumber(val) {
    if (typeof val === 'number') return val;
    if (val == null || val === '') return 0;
    var s = String(val).trim().replace(/€/g, '').replace(/\s/g, '');
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.indexOf(',') > -1) {
      s = s.replace(',', '.');
    }
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function normalizeArticolo(raw) {
    var codice = String(raw.codice || raw.sku || raw.code || '').trim().toUpperCase();
    return {
      codice: codice,
      nome: String(raw.nome || raw.descrizione_breve || raw.name || '').trim(),
      categoria: String(raw.categoria || raw.category || 'Ricambi').trim(),
      prezzo: parseNumber(raw.prezzo || raw.price || 0),
      giacenza: Math.round(parseNumber(raw.giacenza || raw.stock || raw.disponibilita || 0)),
      unita: String(raw.unita || raw.um || 'pz').trim() || 'pz',
      descrizione: String(raw.descrizione || raw.description || '').trim(),
      foto: String(raw.foto || '').trim(),
      attivo: raw.attivo === false || raw.stato === 'Disattivato' ? false : true
    };
  }

  function parseCsv(text) {
    text = text.replace(/^\uFEFF/, '');
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return [];
    var sep = (lines[0].split(';').length > lines[0].split(',').length) ? ';' : ',';
    function splitRow(line) {
      var out = [];
      var cur = '';
      var inQ = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (ch === sep && !inQ) {
          out.push(cur.trim());
          cur = '';
        } else cur += ch;
      }
      out.push(cur.trim());
      return out;
    }
    var headers = splitRow(lines[0]).map(function (h) {
      return h.toLowerCase().replace(/\s+/g, '_');
    });
    var map = {
      codice: 'codice', sku: 'codice', code: 'codice', articolo: 'codice',
      nome: 'nome', descrizione_articolo: 'nome', name: 'nome',
      categoria: 'categoria', category: 'categoria', famiglia: 'categoria',
      prezzo: 'prezzo', price: 'prezzo', listino: 'prezzo',
      giacenza: 'giacenza', stock: 'giacenza', disponibilita: 'giacenza', qty: 'giacenza',
      unita: 'unita', um: 'unita', u_m: 'unita',
      descrizione: 'descrizione', description: 'descrizione', note: 'descrizione'
    };
    var rows = [];
    for (var r = 1; r < lines.length; r++) {
      var cols = splitRow(lines[r]);
      var obj = {};
      headers.forEach(function (h, i) {
        var key = map[h] || h;
        obj[key] = cols[i] || '';
      });
      var art = normalizeArticolo(obj);
      if (art.codice) rows.push(art);
    }
    return rows;
  }

  function toCsv(articoli) {
    var head = 'codice;nome;categoria;prezzo;giacenza;unita;descrizione';
    var body = articoli.map(function (a) {
      function cell(v) {
        v = String(v == null ? '' : v).replace(/"/g, '""');
        return /[;"\n]/.test(v) ? '"' + v + '"' : v;
      }
      return [a.codice, a.nome, a.categoria, String(a.prezzo).replace('.', ','), a.giacenza, a.unita, a.descrizione].map(cell).join(';');
    });
    return head + '\n' + body.join('\n');
  }

  function seeded(n) {
    var x = Math.sin(n) * 10000;
    return x - Math.floor(x);
  }

  function generateSeed(count) {
    count = count || 1200;
    var packs = [
      { cat: 'Compressori', prefix: 'CMP', base: ['Compressore a vite', 'Compressore oil-free', 'Compressore VSD', 'Compressore a pistoni', 'Compressore palettato'] },
      { cat: 'Viti e kit vite', prefix: 'VIT', base: ['Elemento vite', 'Kit revisione vite', 'Rotore maschio', 'Rotore femmina', 'Tenuta vite'] },
      { cat: 'Pompe', prefix: 'PMP', base: ['Pompa vuoto', 'Pompa condensa', 'Pompa olio', 'Pompa vuoto a palette', 'Pompa vuoto claw'] },
      { cat: 'Tubi e raccordi', prefix: 'TUB', base: ['Tubo alluminio', 'Raccordo a T', 'Raccordo a L', 'Manicotto rapido', 'Flessibile aria'] },
      { cat: 'Filtri', prefix: 'FLT', base: ['Filtro aria', 'Filtro olio', 'Filtro coalescente', 'Filtro a carboni', 'Separatore olio'] },
      { cat: 'Ricambi', prefix: 'RIC', base: ['Kit manutenzione', 'Cinghia', 'Valvola minima pressione', 'Termostato', 'Pressostato'] },
      { cat: 'Lubrificanti', prefix: 'OLI', base: ['Olio sintetico', 'Olio minerale', 'Olio food-grade', 'Grasso cuscinetti', 'Olio vuoto'] },
      { cat: 'Essiccatori', prefix: 'ESS', base: ['Essiccatore frigorifero', 'Essiccatore adsorbimento', 'Scarico condensa', 'By-pass essiccatore'] },
      { cat: 'Serbatoi', prefix: 'SRB', base: ['Serbatoio verticale', 'Serbatoio orizzontale', 'Serbatoio zincato', 'Kit scarico serbatoio'] },
      { cat: 'Valvole', prefix: 'VLV', base: ['Valvola di non ritorno', 'Valvola di sicurezza', 'Valvola a sfera', 'Valvola regolazione'] }
    ];
    var items = [];
    var i = 0;
    while (items.length < count) {
      var pack = packs[i % packs.length];
      var n = Math.floor(i / packs.length) + 1;
      var nomeBase = pack.base[n % pack.base.length];
      var codice = pack.prefix + '-' + String(n).padStart(4, '0') + String.fromCharCode(65 + (i % 12));
      var r = seeded(i + 17);
      items.push({
        codice: codice,
        nome: nomeBase + ' ' + (10 + (n % 90)),
        categoria: pack.cat,
        prezzo: Math.round((8 + r * 4200) * 100) / 100,
        giacenza: Math.floor(seeded(i + 99) * 48),
        unita: pack.cat === 'Tubi e raccordi' ? 'm' : (pack.cat === 'Lubrificanti' ? 'l' : 'pz'),
        descrizione: nomeBase + ' per impianti aria compressa. Codice ' + codice + '.',
        attivo: true
      });
      i++;
    }
    return items;
  }

  function ensureSeed() {
    return getMeta('seeded').then(function (done) {
      if (done) return loadArticoli(true);
      return loadArticoli(true).then(function (rows) {
        if (rows.length) {
          return setMeta('seeded', true).then(function () { return rows; });
        }
        return upsertArticoli(generateSeed(1200), true).then(function (all) {
          return setMeta('seeded', true).then(function () { return all; });
        });
      });
    });
  }

  function searchArticoli(opts) {
    opts = opts || {};
    return loadArticoli().then(function (rows) {
      var q = (opts.q || '').trim().toLowerCase();
      var cat = opts.categoria || '';
      var onlyStock = !!opts.soloDisponibili;
      var filtered = rows.filter(function (a) {
        if (a.attivo === false) return false;
        if (cat && a.categoria !== cat) return false;
        if (onlyStock && a.giacenza <= 0) return false;
        if (!q) return true;
        return (a.codice || '').toLowerCase().indexOf(q) > -1 ||
          (a.nome || '').toLowerCase().indexOf(q) > -1 ||
          (a.descrizione || '').toLowerCase().indexOf(q) > -1;
      });
      filtered.sort(function (a, b) { return a.codice.localeCompare(b.codice); });
      var page = Math.max(1, opts.page || 1);
      var size = opts.pageSize || PAGE_SIZE;
      var start = (page - 1) * size;
      return {
        total: filtered.length,
        page: page,
        pageSize: size,
        pages: Math.max(1, Math.ceil(filtered.length / size)),
        rows: filtered.slice(start, start + size)
      };
    });
  }

  function lineTotale(riga) {
    var qty = parseNumber(riga.qty);
    var prezzo = parseNumber(riga.prezzo);
    var sconto = parseNumber(riga.sconto);
    var lordo = qty * prezzo;
    return Math.round(lordo * (1 - sconto / 100) * 100) / 100;
  }

  function blocchiToRighe(blocchi) {
    return (blocchi || []).filter(function (b) { return b.type === 'articolo'; }).map(function (b) {
      return {
        codice: b.codice || '',
        nome: b.nome || '',
        qty: b.qty,
        prezzo: b.prezzo,
        sconto: b.sconto,
        unita: b.unita
      };
    });
  }

  function calcolaPreventivo(prev) {
    var src = (prev.blocchi && prev.blocchi.length)
      ? blocchiToRighe(prev.blocchi)
      : (prev.righe || []);
    var righe = src.map(function (r) {
      var copy = Object.assign({}, r);
      copy.totale = lineTotale(copy);
      return copy;
    });
    var nettoRighe = righe.reduce(function (s, r) { return s + r.totale; }, 0);
    var scontoGlobale = parseNumber(prev.scontoGlobale);
    var netto = Math.round(nettoRighe * (1 - scontoGlobale / 100) * 100) / 100;
    var ivaPerc = prev.ivaPerc == null ? IVA_DEFAULT : parseNumber(prev.ivaPerc);
    var iva = Math.round(netto * ivaPerc) / 100;
    return {
      righe: righe,
      netto: netto,
      iva: Math.round(iva * 100) / 100,
      totale: Math.round((netto + iva) * 100) / 100,
      ivaPerc: ivaPerc
    };
  }

  function nextNumero() {
    return loadPreventivi(true).then(function (rows) {
      var year = new Date().getFullYear();
      var max = 0;
      rows.forEach(function (p) {
        var m = String(p.numero || '').match(/PREV-(\d{4})-(\d+)/);
        if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
      });
      return 'PREV-' + year + '-' + String(max + 1).padStart(4, '0');
    });
  }

  function savePreventivo(prev) {
    var calc = calcolaPreventivo(prev);
      var payload = Object.assign({}, prev, calc, { updatedAt: new Date().toISOString() });
      return openDb().then(function (db) {
      var tx = db.transaction('preventivi', 'readwrite');
      var store = tx.objectStore('preventivi');
      var req;
      if (payload.id) {
        req = store.put(payload);
      } else {
        delete payload.id;
        req = store.add(payload);
      }
      return new Promise(function (resolve, reject) {
        req.onsuccess = function () {
          payload.id = req.result;
          tx.oncomplete = function () {
            cachePreventivi = null;
            resolve(payload);
          };
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function getPreventivo(id) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction('preventivi', 'readonly').objectStore('preventivi').get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function deletePreventivo(id) {
    return openDb().then(function (db) {
      var tx = db.transaction('preventivi', 'readwrite');
      tx.objectStore('preventivi').delete(id);
      return txDone(tx).then(function () {
        cachePreventivi = null;
        return loadPreventivi(true);
      });
    });
  }

  function euro(n) {
    return (parseNumber(n)).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  }

  function uid() {
    return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function compressImage(file, maxW, quality) {
    return new Promise(function (resolve, reject) {
      if (!file) return resolve('');
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        var max = maxW || 900;
        if (w > max) {
          h = Math.round(h * max / w);
          w = max;
        }
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality || 0.72));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('immagine non valida'));
      };
      img.src = url;
    });
  }

  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  global.CronoCatalogo = {
    CATEGORIE: CATEGORIE,
    PAGE_SIZE: PAGE_SIZE,
    IVA_DEFAULT: IVA_DEFAULT,
    ensureSeed: ensureSeed,
    loadArticoli: loadArticoli,
    searchArticoli: searchArticoli,
    saveArticolo: saveArticolo,
    upsertArticoli: upsertArticoli,
    deleteArticolo: deleteArticolo,
    parseCsv: parseCsv,
    toCsv: toCsv,
    generateSeed: generateSeed,
    loadPreventivi: loadPreventivi,
    savePreventivo: savePreventivo,
    getPreventivo: getPreventivo,
    deletePreventivo: deletePreventivo,
    nextNumero: nextNumero,
    calcolaPreventivo: calcolaPreventivo,
    blocchiToRighe: blocchiToRighe,
    uid: uid,
    compressImage: compressImage,
    lineTotale: lineTotale,
    parseNumber: parseNumber,
    euro: euro,
    downloadText: downloadText
  };
})(window);
