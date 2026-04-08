export function renderTests({ els, lesson, testState, normalize, escapeHtml, escapeAttr }) {
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
      const pairs = test.pairs.map((pair) => `<li><strong>${escapeHtml(pair.left)}</strong> -> ${escapeHtml(pair.right)}</li>`).join("");
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
      evaluateTestQuestion({ lesson, test: lesson.tests[index], index, testState, normalize });
    });
  });
}

function evaluateTestQuestion({ test, index, testState, normalize }) {
  const resultEl = document.getElementById(`result_${index}`);
  if (!resultEl) {
    return;
  }

  let userAnswer = "";

  if (test.type === "multiple_choice") {
    const checked = document.querySelector(`input[name="q_${index}"]:checked`);
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
