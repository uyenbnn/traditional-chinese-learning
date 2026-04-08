let lessons = [];
let selectedLessonId = null;
let activeTab = "vocab";
let testState = {
  score: 0,
  answered: 0,
};
let modalState = {
  lessonId: null,
  wordIndex: 0,
};
let audioStatusTimer = null;

const els = {
  lessonList: document.getElementById("lessonList"),
  lessonCountBadge: document.getElementById("lessonCountBadge"),
  loadStatus: document.getElementById("loadStatus"),
  lessonPanel: document.querySelector(".lesson-panel"),
  contentPanel: document.querySelector(".content-panel"),
  lessonEmpty: document.getElementById("lessonEmpty"),
  lessonDetail: document.getElementById("lessonDetail"),
  lessonTitle: document.getElementById("lessonTitle"),
  lessonMeta: document.getElementById("lessonMeta"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  tabVocab: document.getElementById("tabVocab"),
  tabPinyin: document.getElementById("tabPinyin"),
  tabGrammar: document.getElementById("tabGrammar"),
  tabTests: document.getElementById("tabTests"),
  lesson0Link: document.getElementById("lesson0Link"),
  wordModal: document.getElementById("wordModal"),
  wordModalCloseBtn: document.getElementById("wordModalCloseBtn"),
  wordModalContent: document.getElementById("wordModalContent"),
  prevWordBtn: document.getElementById("prevWordBtn"),
  nextWordBtn: document.getElementById("nextWordBtn"),
};

async function init() {
  bindEvents();
  await loadLessonsFromRepository();
  renderLessons();
}

function bindEvents() {
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      setActiveTab();
      renderLessonDetail();
    });
  });

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

  if (els.lesson0Link) {
    els.lesson0Link.addEventListener("click", (event) => {
      event.preventDefault();
      selectedLessonId = "lesson-0";
      activeTab = "pinyin";
      testState = { score: 0, answered: 0 };
      renderLessons();
      focusContentPanelOnMobile();
    });
  }
}

function createPinyinLesson() {
  return {
    id: "lesson-0",
    title: "Pinyin Pronunciation",
    lessonNumber: 0,
    level: "Foundation",
    isPinyinLesson: true,
    vocabulary: [],
    grammar: [],
    tests: [],
  };
}

async function loadLessonsFromRepository() {
  const discovered = [];

  for (let lessonNumber = 1; lessonNumber <= 100; lessonNumber += 1) {
    const basePath = `templates/lesson ${lessonNumber}`;

    try {
      const [vocabRaw, grammarRaw, testRaw] = await Promise.all([
        fetchYaml(`${basePath}/vocabulary.yaml`),
        fetchYaml(`${basePath}/grammar.yaml`),
        fetchYaml(`${basePath}/test.yaml`),
      ]);

      const lesson = parseLessonFiles(lessonNumber, vocabRaw, grammarRaw, testRaw);
      discovered.push(lesson);
    } catch (error) {
      if (error && error.code === "NOT_FOUND") {
        break;
      }

      console.error(error);
      setLoadStatus(`Error loading lesson ${lessonNumber}: ${error.message}`, true);
      break;
    }
  }

  lessons = [createPinyinLesson(), ...discovered];

  if (discovered.length === 0) {
    setLoadStatus("Loaded Lesson 0 (Pinyin). Add templates/lesson 1/{vocabulary.yaml, grammar.yaml, test.yaml} for more lessons.", false);
  } else {
    setLoadStatus(`Loaded ${lessons.length} lessons (including Lesson 0 Pinyin).`, false);
  }
}

async function fetchYaml(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    const error = new Error(`Cannot read ${path} (HTTP ${response.status}).`);
    if (response.status === 404) {
      error.code = "NOT_FOUND";
    }
    throw error;
  }
  return response.text();
}

function parseLessonFiles(lessonNumber, vocabRaw, grammarRaw, testRaw) {
  const vocabData = parseYaml(vocabRaw, `lesson ${lessonNumber} vocabulary.yaml`);
  const grammarData = parseYaml(grammarRaw, `lesson ${lessonNumber} grammar.yaml`);
  const testData = parseYaml(testRaw, `lesson ${lessonNumber} test.yaml`);

  validateVocabularyTemplate(vocabData, lessonNumber);
  validateGrammarTemplate(grammarData, lessonNumber);
  validateTestTemplate(testData, lessonNumber);

  const title = String(vocabData.title || grammarData.title || testData.title || `Lesson ${lessonNumber}`).trim();
  const level = String(vocabData.level || grammarData.level || testData.level || "Unknown").trim();

  return {
    id: `lesson-${lessonNumber}`,
    title,
    lessonNumber,
    level,
    vocabulary: vocabData.vocabulary.map((item) => ({
      traditional: String(item.traditional || "").trim(),
      hanzi: String(item.hanzi || "").trim(),
      wordType: String(item.wordType || "").trim(),
      pinyin: String(item.pinyin || "").trim(),
      meaning: String(item.meaning || "").trim(),
      example: String(item.example || "").trim(),
    })),
    grammar: grammarData.grammar.map((rule) => ({
      title: String(rule.title || "").trim(),
      explanation: String(rule.explanation || "").trim(),
      examples: Array.isArray(rule.examples) ? rule.examples.map((x) => String(x || "").trim()) : [],
    })),
    tests: testData.tests.map((test) => normalizeTest(test)),
  };
}

function parseYaml(raw, label) {
  try {
    return window.jsyaml.load(raw);
  } catch (error) {
    throw new Error(`YAML parse error in ${label}.`);
  }
}

function normalizeTest(test) {
  const base = {
    type: String(test.type || "").trim(),
    question: String(test.question || "").trim(),
    answer: String(test.answer || "").trim(),
  };

  if (base.type === "multiple_choice") {
    base.options = Array.isArray(test.options) ? test.options.map((o) => String(o)) : [];
  }

  if (base.type === "matching") {
    base.pairs = Array.isArray(test.pairs)
      ? test.pairs.map((pair) => ({
          left: String(pair.left || "").trim(),
          right: String(pair.right || "").trim(),
        }))
      : [];
  }

  if (base.type === "listening") {
    base.audioUrl = String(test.audioUrl || "").trim();
  }

  return base;
}

function validateVocabularyTemplate(data, lessonNumber) {
  if (!data || typeof data !== "object") {
    throw new Error(`lesson ${lessonNumber} vocabulary.yaml must be a YAML object.`);
  }

  const required = ["title", "level", "vocabulary"];
  required.forEach((key) => {
    if (data[key] === undefined || data[key] === null) {
      throw new Error(`lesson ${lessonNumber} vocabulary.yaml missing field: ${key}`);
    }
  });

  if (!Array.isArray(data.vocabulary) || data.vocabulary.length === 0) {
    throw new Error(`lesson ${lessonNumber} vocabulary.yaml requires a non-empty vocabulary list.`);
  }

  data.vocabulary.forEach((item, index) => {
    const n = index + 1;
    const requiredKeys = ["traditional", "hanzi", "wordType", "pinyin", "meaning", "example"];
    requiredKeys.forEach((key) => {
      if (!item[key]) {
        throw new Error(`lesson ${lessonNumber} vocabulary.yaml entry ${n} missing ${key}.`);
      }
    });
  });
}

function validateGrammarTemplate(data, lessonNumber) {
  if (!data || typeof data !== "object") {
    throw new Error(`lesson ${lessonNumber} grammar.yaml must be a YAML object.`);
  }

  if (!Array.isArray(data.grammar) || data.grammar.length === 0) {
    throw new Error(`lesson ${lessonNumber} grammar.yaml requires a non-empty grammar list.`);
  }

  data.grammar.forEach((rule, index) => {
    const n = index + 1;
    if (!rule.title || !rule.explanation) {
      throw new Error(`lesson ${lessonNumber} grammar.yaml entry ${n} must include title and explanation.`);
    }
    if (!Array.isArray(rule.examples) || rule.examples.length === 0) {
      throw new Error(`lesson ${lessonNumber} grammar.yaml entry ${n} requires examples list.`);
    }
  });
}

function validateTestTemplate(data, lessonNumber) {
  if (!data || typeof data !== "object") {
    throw new Error(`lesson ${lessonNumber} test.yaml must be a YAML object.`);
  }

  if (!Array.isArray(data.tests) || data.tests.length === 0) {
    throw new Error(`lesson ${lessonNumber} test.yaml requires a non-empty tests list.`);
  }

  const allowedTests = ["multiple_choice", "fill_blank", "matching", "listening"];
  data.tests.forEach((test, idx) => {
    const n = idx + 1;
    if (!allowedTests.includes(test.type)) {
      throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] unsupported type: ${test.type}`);
    }

    if (!test.question) {
      throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] requires question.`);
    }

    if ((test.type === "multiple_choice" || test.type === "fill_blank" || test.type === "listening") && !test.answer) {
      throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] requires answer.`);
    }

    if (test.type === "multiple_choice") {
      if (!Array.isArray(test.options) || test.options.length < 2) {
        throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] multiple_choice requires at least 2 options.`);
      }
    }

    if (test.type === "matching") {
      if (!Array.isArray(test.pairs) || test.pairs.length < 1) {
        throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] matching requires pairs.`);
      }
    }

    if (test.type === "listening" && !test.audioUrl) {
      throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] listening requires audioUrl.`);
    }
  });
}

function renderLessons() {
  els.lessonList.innerHTML = "";
  els.lessonCountBadge.textContent = `${lessons.length} lesson${lessons.length > 1 ? "s" : ""}`;

  lessons.forEach((lesson, index) => {
    const card = document.createElement("article");
    card.className = "lesson-card";
    card.style.animationDelay = `${index * 40}ms`;
    if (lesson.id === selectedLessonId) {
      card.classList.add("active");
    }

    if (lesson.isPinyinLesson) {
      card.innerHTML = `
        <h4>Lesson 0: ${escapeHtml(lesson.title)}</h4>
        <p>Foundation | Interactive tones, initials, finals, and rhythm</p>
      `;
    } else {
      card.innerHTML = `
        <h4>Lesson ${lesson.lessonNumber}: ${escapeHtml(lesson.title)}</h4>
        <p>${escapeHtml(lesson.level)} | ${lesson.vocabulary.length} words | ${lesson.tests.length} tests</p>
      `;
    }

    card.addEventListener("click", () => {
      selectedLessonId = lesson.id;
      activeTab = lesson.isPinyinLesson ? "pinyin" : "vocab";
      testState = { score: 0, answered: 0 };
      renderLessons();
      focusContentPanelOnMobile();
    });

    els.lessonList.appendChild(card);
  });

  renderLessonDetail();
}

function setActiveTab() {
  els.tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === activeTab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  els.tabVocab.classList.toggle("active", activeTab === "vocab");
  els.tabPinyin.classList.toggle("active", activeTab === "pinyin");
  els.tabGrammar.classList.toggle("active", activeTab === "grammar");
  els.tabTests.classList.toggle("active", activeTab === "tests");
}

function focusContentPanelOnMobile() {
  if (!els.contentPanel) {
    return;
  }

  if (window.matchMedia("(max-width: 899px)").matches) {
    requestAnimationFrame(() => {
      els.contentPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function renderLessonDetail() {
  const lesson = lessons.find((x) => x.id === selectedLessonId) || lessons[0];

  if (!lesson) {
    els.lessonEmpty.classList.remove("hidden");
    els.lessonDetail.classList.add("hidden");
    return;
  }

  selectedLessonId = lesson.id;
  els.lessonEmpty.classList.add("hidden");
  els.lessonDetail.classList.remove("hidden");

  if (lesson.isPinyinLesson) {
    els.lessonTitle.textContent = "Lesson 0: Pinyin Pronunciation";
    els.lessonMeta.textContent = "Foundation | Tones, sounds, stress, and rhythm";
  } else {
    els.lessonTitle.textContent = `Lesson ${lesson.lessonNumber}: ${lesson.title}`;
    els.lessonMeta.textContent = `${lesson.level} | ${lesson.vocabulary.length} words | ${lesson.grammar.length} grammar notes | ${lesson.tests.length} tests`;
  }

  setActiveTab();
  renderPinyin();

  if (lesson.isPinyinLesson) {
    const pinyinOnlyMessage = `
      <article class="grammar-card">
        <h4>Lesson 0 is dedicated to pronunciation.</h4>
        <p class="meta-line">Use the Lesson 0 link to practice tones, initials, finals, and rhythm.</p>
      </article>
    `;
    els.tabVocab.innerHTML = pinyinOnlyMessage;
    els.tabGrammar.innerHTML = pinyinOnlyMessage;
    els.tabTests.innerHTML = pinyinOnlyMessage;
    return;
  }

  renderVocab(lesson);
  renderGrammar(lesson);
  renderTests(lesson);
}

function renderPinyin() {
  if (!els.tabPinyin) {
    return;
  }

  const tones = [
    { mark: "1st", contour: "ma (high-level)", note: "Hold a steady high pitch.", sampleText: "妈", sampleLabel: "First tone ma" },
    { mark: "2nd", contour: "ma (rising)", note: "Rise from mid to high, like asking a question.", sampleText: "麻", sampleLabel: "Second tone ma" },
    { mark: "3rd", contour: "ma (falling-rising)", note: "Dip down then rise; in fast speech it may sound low.", sampleText: "马", sampleLabel: "Third tone ma" },
    { mark: "4th", contour: "ma (falling)", note: "Drop sharply from high to low.", sampleText: "骂", sampleLabel: "Fourth tone ma" },
    { mark: "Neutral", contour: "ma (light)", note: "Short, light, and unstressed.", sampleText: "吗", sampleLabel: "Neutral tone ma" },
  ];

  const initials = [
    { symbol: "b", sampleText: "八", sampleLabel: "Initial b" },
    { symbol: "p", sampleText: "趴", sampleLabel: "Initial p" },
    { symbol: "m", sampleText: "妈", sampleLabel: "Initial m" },
    { symbol: "f", sampleText: "发", sampleLabel: "Initial f" },
    { symbol: "d", sampleText: "大", sampleLabel: "Initial d" },
    { symbol: "t", sampleText: "他", sampleLabel: "Initial t" },
    { symbol: "n", sampleText: "你", sampleLabel: "Initial n" },
    { symbol: "l", sampleText: "了", sampleLabel: "Initial l" },
    { symbol: "g", sampleText: "哥", sampleLabel: "Initial g" },
    { symbol: "k", sampleText: "科", sampleLabel: "Initial k" },
    { symbol: "h", sampleText: "喝", sampleLabel: "Initial h" },
    { symbol: "j", sampleText: "机", sampleLabel: "Initial j" },
    { symbol: "q", sampleText: "七", sampleLabel: "Initial q" },
    { symbol: "x", sampleText: "西", sampleLabel: "Initial x" },
    { symbol: "zh", sampleText: "知", sampleLabel: "Initial zh" },
    { symbol: "ch", sampleText: "吃", sampleLabel: "Initial ch" },
    { symbol: "sh", sampleText: "诗", sampleLabel: "Initial sh" },
    { symbol: "r", sampleText: "日", sampleLabel: "Initial r" },
    { symbol: "z", sampleText: "资", sampleLabel: "Initial z" },
    { symbol: "c", sampleText: "次", sampleLabel: "Initial c" },
    { symbol: "s", sampleText: "思", sampleLabel: "Initial s" },
    { symbol: "y", sampleText: "衣", sampleLabel: "Initial y" },
    { symbol: "w", sampleText: "乌", sampleLabel: "Initial w" },
  ];

  const finals = [
    { symbol: "a", sampleText: "啊", sampleLabel: "Final a" },
    { symbol: "o", sampleText: "喔", sampleLabel: "Final o" },
    { symbol: "e", sampleText: "饿", sampleLabel: "Final e" },
    { symbol: "i", sampleText: "衣", sampleLabel: "Final i" },
    { symbol: "u", sampleText: "乌", sampleLabel: "Final u" },
    { symbol: "u (yu)", sampleText: "鱼", sampleLabel: "Final yu" },
    { symbol: "ai", sampleText: "爱", sampleLabel: "Final ai" },
    { symbol: "ei", sampleText: "诶", sampleLabel: "Final ei" },
    { symbol: "ao", sampleText: "奥", sampleLabel: "Final ao" },
    { symbol: "ou", sampleText: "欧", sampleLabel: "Final ou" },
    { symbol: "an", sampleText: "安", sampleLabel: "Final an" },
    { symbol: "en", sampleText: "恩", sampleLabel: "Final en" },
    { symbol: "ang", sampleText: "昂", sampleLabel: "Final ang" },
    { symbol: "eng", sampleText: "鞥", sampleLabel: "Final eng" },
    { symbol: "ong", sampleText: "翁", sampleLabel: "Final ong" },
    { symbol: "ia", sampleText: "呀", sampleLabel: "Final ia" },
    { symbol: "ie", sampleText: "耶", sampleLabel: "Final ie" },
    { symbol: "iao", sampleText: "腰", sampleLabel: "Final iao" },
    { symbol: "iu", sampleText: "优", sampleLabel: "Final iu" },
    { symbol: "ian", sampleText: "烟", sampleLabel: "Final ian" },
    { symbol: "in", sampleText: "因", sampleLabel: "Final in" },
    { symbol: "iang", sampleText: "央", sampleLabel: "Final iang" },
    { symbol: "ing", sampleText: "英", sampleLabel: "Final ing" },
    { symbol: "iong", sampleText: "拥", sampleLabel: "Final iong" },
    { symbol: "ua", sampleText: "蛙", sampleLabel: "Final ua" },
    { symbol: "uo", sampleText: "窝", sampleLabel: "Final uo" },
    { symbol: "uai", sampleText: "歪", sampleLabel: "Final uai" },
    { symbol: "ui", sampleText: "威", sampleLabel: "Final ui" },
    { symbol: "uan", sampleText: "弯", sampleLabel: "Final uan" },
    { symbol: "un", sampleText: "温", sampleLabel: "Final un" },
    { symbol: "uang", sampleText: "汪", sampleLabel: "Final uang" },
    { symbol: "ueng", sampleText: "翁", sampleLabel: "Final ueng" },
    { symbol: "ve", sampleText: "约", sampleLabel: "Final ve" },
    { symbol: "van", sampleText: "冤", sampleLabel: "Final van" },
    { symbol: "vn", sampleText: "晕", sampleLabel: "Final vn" },
  ];

  const toneRows = tones
    .map(
      (tone) => `
        <article class="pinyin-card">
          <h4>${escapeHtml(tone.mark)}</h4>
          <p class="meta-line">${escapeHtml(tone.contour)}</p>
          <p class="meta-line">${escapeHtml(tone.note)}</p>
          <button class="pinyin-play-btn" type="button" data-audio-text="${escapeAttr(tone.sampleText)}" data-audio-label="${escapeAttr(tone.sampleLabel)}">Play sample</button>
        </article>
      `,
    )
    .join("");

  const initialPills = initials
    .map(
      (item) =>
        `<button class="pinyin-pill" type="button" data-audio-text="${escapeAttr(item.sampleText)}" data-audio-label="${escapeAttr(item.sampleLabel)}">${escapeHtml(item.symbol)}</button>`,
    )
    .join("");
  const finalPills = finals
    .map(
      (item) =>
        `<button class="pinyin-pill" type="button" data-audio-text="${escapeAttr(item.sampleText)}" data-audio-label="${escapeAttr(item.sampleLabel)}">${escapeHtml(item.symbol)}</button>`,
    )
    .join("");

  els.tabPinyin.innerHTML = `
    <section class="pinyin-section">
      <h4>1. Tones and Stress</h4>
      <p class="meta-line">Mandarin meaning depends on tone. Practice tone shape before speed.</p>
      <p id="pinyinAudioStatus" class="helper-text" aria-live="polite">Click any sample to hear pronunciation.</p>
      <div class="pinyin-grid">${toneRows}</div>
    </section>

    <section class="pinyin-section">
      <h4>2. Initial Sounds (Consonants)</h4>
      <p class="meta-line">Focus on contrast pairs: j/q/x vs zh/ch/sh, and z/c/s.</p>
      <div class="pinyin-pills">${initialPills}</div>
    </section>

    <section class="pinyin-section">
      <h4>3. Final Sounds (Vowels and Endings)</h4>
      <p class="meta-line">Master simple vowels first, then nasal endings like -n and -ng.</p>
      <div class="pinyin-pills">${finalPills}</div>
    </section>

    <section class="pinyin-section">
      <h4>4. Tone Sandhi and Rhythm</h4>
      <ul>
        <li>Two third tones together: first one changes to second tone (ni hao).</li>
        <li>"bu" becomes second tone before a fourth tone (bu yao -> bu yao).</li>
        <li>"yi" changes by following tone (yi ge, yi yang, yi ci).</li>
        <li>Keep sentence rhythm natural: content words carry stress, particles are lighter.</li>
      </ul>
    </section>
  `;

  Array.from(els.tabPinyin.querySelectorAll("[data-audio-text]")).forEach((node) => {
    node.addEventListener("click", () => {
      const text = node.getAttribute("data-audio-text") || "";
      const label = node.getAttribute("data-audio-label") || text;
      playPinyinAudio(text, label);
    });
  });
}

function playPinyinAudio(text, label) {
  const statusEl = document.getElementById("pinyinAudioStatus");
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    if (statusEl) {
      statusEl.textContent = "Audio is not supported in this browser.";
    }
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.84;
  utterance.pitch = 1.02;

  if (statusEl) {
    statusEl.textContent = `Playing: ${label}`;
  }

  utterance.onend = () => {
    if (statusEl) {
      statusEl.textContent = `Finished: ${label}`;
      if (audioStatusTimer) {
        window.clearTimeout(audioStatusTimer);
      }
      audioStatusTimer = window.setTimeout(() => {
        if (statusEl) {
          statusEl.textContent = "Click any sample to hear pronunciation.";
        }
      }, 1200);
    }
  };

  window.speechSynthesis.speak(utterance);
}

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

  modalState.lessonId = lessonId;
  modalState.wordIndex = wordIndex;
  renderWordModalContent();

  els.wordModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function renderWordModalContent() {
  const lesson = lessons.find((item) => item.id === modalState.lessonId);
  if (!lesson || !lesson.vocabulary[modalState.wordIndex] || !els.wordModalContent) {
    return;
  }

  const word = lesson.vocabulary[modalState.wordIndex];
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
    title.textContent = `Word Detail (${modalState.wordIndex + 1}/${total})`;
  }

  if (els.prevWordBtn) {
    els.prevWordBtn.disabled = modalState.wordIndex <= 0;
  }
  if (els.nextWordBtn) {
    els.nextWordBtn.disabled = modalState.wordIndex >= total - 1;
  }
}

function showPreviousWord() {
  const lesson = lessons.find((item) => item.id === modalState.lessonId);
  if (!lesson) {
    return;
  }
  modalState.wordIndex = Math.max(0, modalState.wordIndex - 1);
  renderWordModalContent();
}

function showNextWord() {
  const lesson = lessons.find((item) => item.id === modalState.lessonId);
  if (!lesson) {
    return;
  }
  modalState.wordIndex = Math.min(lesson.vocabulary.length - 1, modalState.wordIndex + 1);
  renderWordModalContent();
}

function closeWordModal() {
  if (!els.wordModal) {
    return;
  }
  els.wordModal.classList.add("hidden");
  document.body.style.overflow = "";
}

function renderGrammar(lesson) {
  els.tabGrammar.innerHTML = "";

  lesson.grammar.forEach((rule) => {
    const card = document.createElement("article");
    card.className = "grammar-card";

    const list = rule.examples.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("");

    card.innerHTML = `
      <h4>${escapeHtml(rule.title)}</h4>
      <p class="meta-line">${escapeHtml(rule.explanation)}</p>
      <ul>${list}</ul>
    `;

    els.tabGrammar.appendChild(card);
  });
}

function renderTests(lesson) {
  els.tabTests.innerHTML = "";

  lesson.tests.forEach((test, idx) => {
    const card = document.createElement("article");
    card.className = "test-card";

    const title = `<h4>Q${idx + 1}. ${escapeHtml(test.question)}</h4>`;
    let body = "";

    if (test.type === "multiple_choice") {
      const options = test.options
        .map((opt, i) => {
          const id = `q${idx}_opt${i}`;
          return `
            <label for="${id}" class="meta-line">
              <input id="${id}" type="radio" name="q_${idx}" value="${escapeAttr(opt)}" /> ${escapeHtml(opt)}
            </label>
          `;
        })
        .join("");

      body = `${options}<button class="small-btn" data-submit="${idx}">Check</button>`;
    }

    if (test.type === "fill_blank") {
      body = `
        <input type="text" id="fill_${idx}" placeholder="Type your answer" />
        <button class="small-btn" data-submit="${idx}">Check</button>
      `;
    }

    if (test.type === "matching") {
      const pairs = test.pairs
        .map((pair) => `<li><strong>${escapeHtml(pair.left)}</strong> → ${escapeHtml(pair.right)}</li>`)
        .join("");

      body = `<p class="meta-line">Match each pair:</p><ul>${pairs}</ul><button class="small-btn" data-submit="${idx}">Mark as Done</button>`;
    }

    if (test.type === "listening") {
      body = `
        <audio controls src="${escapeAttr(test.audioUrl)}"></audio>
        <input type="text" id="listen_${idx}" placeholder="Type what you heard" />
        <button class="small-btn" data-submit="${idx}">Check</button>
      `;
    }

    card.innerHTML = `${title}${body}<div id="result_${idx}" class="test-result"></div>`;
    els.tabTests.appendChild(card);
  });

  const score = document.createElement("div");
  score.className = "score-banner";
  score.id = "scoreBanner";
  score.textContent = `Score: ${testState.score}/${Math.max(testState.answered, 0)} answered`;
  els.tabTests.appendChild(score);

  Array.from(els.tabTests.querySelectorAll("[data-submit]")).forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.submit);
      evaluateTestQuestion(lesson.tests[index], index);
    });
  });
}

function evaluateTestQuestion(test, index) {
  const resultEl = document.getElementById(`result_${index}`);
  if (!resultEl) return;

  let userAnswer = "";

  if (test.type === "multiple_choice") {
    const checked = document.querySelector(`input[name=\"q_${index}\"]:checked`);
    userAnswer = checked ? checked.value.trim() : "";
  }

  if (test.type === "fill_blank") {
    const input = document.getElementById(`fill_${index}`);
    userAnswer = input ? input.value.trim() : "";
  }

  if (test.type === "listening") {
    const input = document.getElementById(`listen_${index}`);
    userAnswer = input ? input.value.trim() : "";
  }

  if (test.type === "matching") {
    userAnswer = "done";
  }

  if (!userAnswer) {
    resultEl.textContent = "Please answer first.";
    return;
  }

  const correct = test.type === "matching" ? true : normalize(userAnswer) === normalize(test.answer);
  resultEl.textContent = correct ? "Correct." : `Not correct. Answer: ${test.answer}`;
  resultEl.style.color = correct ? "var(--ok)" : "var(--danger)";

  testState.answered += 1;
  if (correct) {
    testState.score += 1;
  }

  const scoreBanner = document.getElementById("scoreBanner");
  if (scoreBanner) {
    scoreBanner.textContent = `Score: ${testState.score}/${testState.answered} answered`;
  }
}

function normalize(value) {
  return String(value).replace(/\s+/g, "").toLowerCase();
}

function setLoadStatus(msg, isError) {
  if (!els.loadStatus) {
    return;
  }
  els.loadStatus.textContent = msg;
  els.loadStatus.classList.toggle("error", Boolean(isError));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "");
}

init();
