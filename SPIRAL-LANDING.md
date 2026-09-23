# Spirale scroll-driven — guida rapida

Landing homepage (`index.html`) con spirale 3D continua sincronizzata allo scroll.

## File

| File | Ruolo |
|------|--------|
| `js/spiral-config.js` | Parametri forma, luminosità, performance |
| `js/spiral-scene.js` | Geometria InstancedMesh, noise, render loop |
| `js/page-scroll.js` | Scroll full-page, timeline, bridge verso la spirale |
| `css/style.css` | Tema dark full-page (`html.fp-on`) |

## Modificare la spirale

Edita `js/spiral-config.js`:

- **segments** — numero anelli (desktop); su mobile moltiplicato per `mobileScale`
- **turns** — giri della molla
- **spiralRadius** / **spiralDepth** — larghezza e lunghezza
- **thickness** — spessore di ogni anello
- **glow** / **opacity** — intensità luminosa
- **noise** × **distortion** — deformazione organica (tenere basse)
- **scrollDamping** — lasciare a `1` (lo smoothing è gestito da `page-scroll.js` via `deckSmooth`)
- **mouseInfluence** — parallax mouse

## Timeline scroll (0 → 100%)

In `js/page-scroll.js`, array `CronoSpiralConfig.timeline` (se non definito in `spiral-config.js`):

- **t** — progresso normalizzato 0…1
- **x, y, z** — posizione gruppo spirale
- **rx, ry, rz** — rotazione
- **s** — scala
- **camZ, camX, camY** — camera
- **frontLayer** — > 0.5 porta il canvas sopra al contenuto (attraversamento)

## Scroll e velocità

In `js/page-scroll.js`:

- `scrollSensitivity` — quanto ogni tick della rotella muove la timeline
- Durata animazione `goTo()` — transizioni da tastiera/dots

## Performance mobile

Ridurre in `spiral-config.js`: `segments`, `mobileScale`, `glow`, `ringSegments`.

## Disattivare

Rimuovere la classe `fp-home` dal `<body>` o attivare `prefers-reduced-motion`.
