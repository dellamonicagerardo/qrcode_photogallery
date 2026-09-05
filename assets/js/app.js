bootEvent()
  .then((config) => {
    initIntro();
    initIntroBackground(config);
    initGallery(config);
    initRouter(config.id);
  })
  .catch((err) => {
    console.error(err);
    showBootError(`Errore caricamento evento: ${err.message}`);
  });
