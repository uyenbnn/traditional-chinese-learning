export function renderGrammar({ els, lesson, escapeHtml }) {
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
