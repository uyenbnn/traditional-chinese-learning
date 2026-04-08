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

function getSiteBasePath() {
  const { pathname } = window.location;

  if (pathname.endsWith("/")) {
    return pathname;
  }

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "";

  if (lastSegment.includes(".")) {
    const lastSlash = pathname.lastIndexOf("/");
    return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : "/";
  }

  return `${pathname}/`;
}

function buildLessonTemplateBasePath(lessonNumber) {
  const siteBasePath = getSiteBasePath();
  const lessonFolder = encodeURIComponent(`lesson ${lessonNumber}`);
  return `${siteBasePath}templates/${lessonFolder}`;
}

function parseYaml(raw, label) {
  try {
    return window.jsyaml.load(raw);
  } catch (_error) {
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

    if (test.type === "multiple_choice" && (!Array.isArray(test.options) || test.options.length < 2)) {
      throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] multiple_choice requires at least 2 options.`);
    }

    if (test.type === "matching" && (!Array.isArray(test.pairs) || test.pairs.length < 1)) {
      throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] matching requires pairs.`);
    }

    if (test.type === "listening" && !test.audioUrl) {
      throw new Error(`lesson ${lessonNumber} test.yaml tests[${n}] listening requires audioUrl.`);
    }
  });
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

export async function loadLessonsFromRepository({ setLoadStatus }) {
  const discovered = [];

  for (let lessonNumber = 1; lessonNumber <= 100; lessonNumber += 1) {
    const basePath = buildLessonTemplateBasePath(lessonNumber);

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

  const lessons = [createPinyinLesson(), ...discovered];

  if (discovered.length === 0) {
    setLoadStatus("Loaded Lesson 0 (Pinyin). Add templates/lesson 1/{vocabulary.yaml, grammar.yaml, test.yaml} for more lessons.", false);
  } else {
    setLoadStatus(`Loaded ${lessons.length} lessons (including Lesson 0 Pinyin).`, false);
  }

  return lessons;
}
