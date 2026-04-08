let audioStatusTimer = null;

export function renderPinyin({ els, escapeHtml, escapeAttr }) {
  if (!els.tabPinyin) {
    return;
  }

  const tones = [
    { mark: "1st Tone", contour: "ma (high-level)", note: "Hold a steady high pitch.", sampleText: "妈", sampleLabel: "First tone ma" },
    { mark: "2nd Tone", contour: "ma (rising)", note: "Rise from mid to high, like asking a question.", sampleText: "麻", sampleLabel: "Second tone ma" },
    { mark: "3rd Tone", contour: "ma (falling-rising)", note: "Dip down then rise; in fast speech it may sound low.", sampleText: "马", sampleLabel: "Third tone ma" },
    { mark: "4th Tone", contour: "ma (falling)", note: "Drop sharply from high to low.", sampleText: "骂", sampleLabel: "Fourth tone ma" },
    { mark: "Neutral Tone", contour: "ma (light)", note: "Short, light, and unstressed.", sampleText: "吗", sampleLabel: "Neutral tone ma" },
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
          <button class="pinyin-play-btn" type="button" data-audio-text="${escapeAttr(tone.sampleText)}" data-audio-label="${escapeAttr(tone.sampleLabel)}">Play</button>
        </article>
      `,
    )
    .join("");

  const initialPills = initials
    .map(
      (item) => `<button class="pinyin-pill" type="button" data-audio-text="${escapeAttr(item.sampleText)}" data-audio-label="${escapeAttr(item.sampleLabel)}">${escapeHtml(item.symbol)}</button>`,
    )
    .join("");

  const finalPills = finals
    .map(
      (item) => `<button class="pinyin-pill" type="button" data-audio-text="${escapeAttr(item.sampleText)}" data-audio-label="${escapeAttr(item.sampleLabel)}">${escapeHtml(item.symbol)}</button>`,
    )
    .join("");

  els.tabPinyin.innerHTML = `
    <section class="pinyin-section">
      <h4>1. Tones and Stress</h4>
      <p class="meta-line">Mandarin meaning depends on tone. Practice tone shape before speed.</p>
      <p id="pinyinAudioStatus" class="helper-text pinyin-audio-status" aria-live="polite">Tap Play to hear pronunciation.</p>
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
    if (!statusEl) {
      return;
    }

    statusEl.textContent = `Finished: ${label}`;
    if (audioStatusTimer) {
      window.clearTimeout(audioStatusTimer);
    }

    audioStatusTimer = window.setTimeout(() => {
      statusEl.textContent = "Tap Play to hear pronunciation.";
    }, 1200);
  };

  window.speechSynthesis.speak(utterance);
}
