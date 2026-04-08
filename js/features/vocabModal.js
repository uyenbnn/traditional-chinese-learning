export function createVocabModalFeature({ els, appState, escapeHtml, escapeAttr }) {
  function renderVocab(lesson) {
    els.tabVocab.innerHTML = "";

    lesson.vocabulary.forEach((item, wordIndex) => {
      const card = document.createElement("article");
      card.className = "vocab-card";
      card.innerHTML = `
        <button class="word-trigger" type="button" aria-label="Open word detail for ${escapeAttr(item.traditional)}">
          <div class="vocab-head">
            <div class="vocab-word">${escapeHtml(item.traditional)}</div>
            <div class="vocab-hanzi">${escapeHtml(item.hanzi)}</div>
          </div>
        </button>
        <div class="meta-line">Pinyin: ${escapeHtml(item.pinyin)} | Meaning: ${escapeHtml(item.meaning)}</div>
        <div class="meta-line">Word Type: ${escapeHtml(item.wordType)}</div>
        <div class="meta-line">Example: ${escapeHtml(item.example)}</div>
      `;

      const trigger = card.querySelector(".word-trigger");
      if (trigger) {
        trigger.addEventListener("click", () => {
          openWordModal(lesson.id, wordIndex);
        });
      }

      els.tabVocab.appendChild(card);
    });
  }

  function openWordModal(lessonId, wordIndex) {
    if (!els.wordModal || !els.wordModalContent) {
      return;
    }

    appState.modalState.lessonId = lessonId;
    appState.modalState.wordIndex = wordIndex;
    renderWordModalContent();

    els.wordModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function renderWordModalContent() {
    const lesson = appState.lessons.find((item) => item.id === appState.modalState.lessonId);
    if (!lesson || !lesson.vocabulary[appState.modalState.wordIndex] || !els.wordModalContent) {
      return;
    }

    const word = lesson.vocabulary[appState.modalState.wordIndex];
    const total = lesson.vocabulary.length;

    els.wordModalContent.innerHTML = `
      <div class="word-detail-layout">
        <div class="word-main-col">
          <div class="word-display-main">${escapeHtml(word.traditional)}</div>
          <div class="word-display-sub">${escapeHtml(word.hanzi)}</div>
        </div>
        <div class="word-info-col">
          <div class="word-detail-row">
            <span class="word-detail-label">Word Type</span>
            <span class="word-detail-value">${escapeHtml(word.wordType)}</span>
          </div>
          <div class="word-detail-row">
            <span class="word-detail-label">Pinyin</span>
            <span class="word-detail-value">${escapeHtml(word.pinyin)}</span>
          </div>
          <div class="word-detail-row">
            <span class="word-detail-label">Meaning</span>
            <span class="word-detail-value">${escapeHtml(word.meaning)}</span>
          </div>
          <div class="word-detail-row">
            <span class="word-detail-label">Example</span>
            <span class="word-detail-value">${escapeHtml(word.example)}</span>
          </div>
        </div>
      </div>
    `;

    const title = document.getElementById("wordModalTitle");
    if (title) {
      title.textContent = `Word Detail (${appState.modalState.wordIndex + 1}/${total})`;
    }

    if (els.prevWordBtn) {
      els.prevWordBtn.disabled = appState.modalState.wordIndex <= 0;
    }

    if (els.nextWordBtn) {
      els.nextWordBtn.disabled = appState.modalState.wordIndex >= total - 1;
    }
  }

  function showPreviousWord() {
    const lesson = appState.lessons.find((item) => item.id === appState.modalState.lessonId);
    if (!lesson) {
      return;
    }

    appState.modalState.wordIndex = Math.max(0, appState.modalState.wordIndex - 1);
    renderWordModalContent();
  }

  function showNextWord() {
    const lesson = appState.lessons.find((item) => item.id === appState.modalState.lessonId);
    if (!lesson) {
      return;
    }

    appState.modalState.wordIndex = Math.min(lesson.vocabulary.length - 1, appState.modalState.wordIndex + 1);
    renderWordModalContent();
  }

  function closeWordModal() {
    if (!els.wordModal) {
      return;
    }

    els.wordModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function bindModalEvents() {
    if (els.wordModalCloseBtn) {
      els.wordModalCloseBtn.addEventListener("click", closeWordModal);
    }

    if (els.prevWordBtn) {
      els.prevWordBtn.addEventListener("click", showPreviousWord);
    }

    if (els.nextWordBtn) {
      els.nextWordBtn.addEventListener("click", showNextWord);
    }

    if (els.wordModal) {
      els.wordModal.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
          closeWordModal();
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeWordModal();
      }
    });
  }

  return {
    bindModalEvents,
    renderVocab,
  };
}
