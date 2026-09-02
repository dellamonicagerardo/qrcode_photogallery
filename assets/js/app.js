bootEvent()
  .then((config) => {
    initIntro();
    initIntroBackground(config);
    initGallery(config);
  })
  .catch((err) => {
    console.error(err);
    showBootError(`Errore caricamento evento: ${err.message}`);
  });
