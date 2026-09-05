# Gallery fotografica — GitHub Pages + QR Code

Progetto **100% statico**: HTML, CSS, JS e JSON. Nessun build.

## Struttura cartelle

```
eventi/                    ← JSON per ogni evento
images/
  nascita/
    original/                ← originali mirrorless (non su git)
    thumbs/                  ← miniatura griglia (~720 px)
    full/                    ← lightbox (~1600 px)
  matrimonio/
    original/
    thumbs/
    full/
videos/
  nascita/                   ← video per evento
  matrimonio/
```

## Anteprima locale

```bash
python -m http.server 5500
```

- `http://localhost:5500/?event=nascita`
- `http://localhost:5500/?event=matrimonio`
- `http://localhost:5500/?event=nascita#gallery`
- `http://localhost:5500/?event=nascita#foto/3` — apre direttamente la 3ª foto

### URL condivisibili

| URL | Effetto |
|-----|---------|
| `?event=nascita` | Intro dell’evento |
| `?event=nascita#gallery` | Gallery |
| `?event=nascita#foto/2` | Lightbox sulla 2ª foto (1-based) |

Su smartphone, **Indietro / swipe back** chiude il lightbox e torna alla gallery (History API).

### Colori del template

Definiti in `eventi/<evento>.json` → `theme.colors` (come i menu di `qrcode_demo`).

Override opzionale da URL (utile per QR personalizzati senza nuovo JSON):

```
?event=nascita&bg=%23faf6f2&accent=%23c9a99a&gold=%23b8956a&text=%233d2f2a
```

Chiavi: `bg`, `bgWarm`, `surface`, `text`, `textSoft`, `accent`, `accentLight`, `gold`, `gradient1`, `gradient2` (anche in kebab-case: `bg-warm`).

## Ottimizzare foto mirrorless

1. Copia i JPEG in `images/<evento>/original/`
2. Esegui:

```powershell
.\scripts\optimize-images.ps1 -Event nascita
```

3. Usa i path in `eventi/<evento>.json`:

```json
"items": [
  "images/nascita/full/01.jpg",
  "images/nascita/full/02.jpg"
]
```

La gallery carica `thumbs/` in griglia e `full/` nel lightbox.

## Nuovo evento

1. Crea cartelle `images/mio-evento/original/`, `thumbs/`, `full/`
2. Copia `eventi/nascita.json` → `eventi/mio-evento.json`
3. `.\scripts\generate-event-manifest.ps1`
4. QR: `?event=mio-evento`

## GitHub Pages

Settings → Pages → branch `main` → `/ (root)`.
