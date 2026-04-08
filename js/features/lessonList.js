export function renderLessonCards({ els, lessons, selectedLessonId, onSelectLesson, escapeHtml }) {
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
      onSelectLesson(lesson);
    });

    els.lessonList.appendChild(card);
  });
}
