export const appState = {
  lessons: [],
  selectedLessonId: null,
  activeTab: "vocab",
  testState: {
    score: 0,
    answered: 0,
  },
  modalState: {
    lessonId: null,
    wordIndex: 0,
  },
};

export function resetTestState() {
  appState.testState.score = 0;
  appState.testState.answered = 0;
}
