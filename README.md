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
python -m http.server 8080
```

- `http://localhost:8080/?event=nascita`
- `http://localhost:8080/?event=matrimonio`

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
