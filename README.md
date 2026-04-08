# Traditional Chinese Lesson Studio (HTML/CSS/JS MVP)

This is a learner-only front-end implementation.
Lesson content is managed directly in repository files under the `templates` folder.

## Run

Because this is plain HTML/CSS/JS, you can open `index.html` directly in a browser.
For best compatibility, run with a simple local static server.

## Implemented Features

- Responsive learner view.
- Lesson cards with detail panel.
- Lesson tabs: Vocabulary, Grammar, Tests.
- Test types implemented:
  - `multiple_choice`
  - `fill_blank`
  - `matching`
  - `listening`
- Repository template ingestion:
  - Auto-scans `templates/lesson 1`, `templates/lesson 2`, ...
  - Reads `vocabulary.yaml`, `grammar.yaml`, `test.yaml` for each lesson folder
  - Validates structure and required fields before rendering lessons

## Template Folder Structure

Use this structure exactly:

```text
templates/
  lesson 1/
    vocabulary.yaml
    grammar.yaml
    test.yaml
  lesson 2/
    vocabulary.yaml
    grammar.yaml
    test.yaml
```

When you add a new folder (`lesson 3`, `lesson 4`, ...), it appears automatically in the app.

### vocabulary.yaml
- `title`
- `level`
- `vocabulary` (array)
  - `traditional`
  - `hanzi`
  - `wordType`
  - `pinyin`
  - `meaning`
  - `example`

### grammar.yaml
- `title`
- `grammar` (array)
  - `title`
  - `explanation`
  - `examples` (array)

### test.yaml
- `title`
- `tests` (array)
  - `type`: `multiple_choice`, `fill_blank`, `matching`, `listening`
  - `question`
  - type-specific fields:
    - `multiple_choice`: `options`, `answer`
    - `fill_blank`: `answer`
    - `matching`: `pairs` with `left`, `right`
    - `listening`: `audioUrl`, `answer`

## Sample Templates

Use these sample folders as starters:
- `templates/lesson 1/`
- `templates/lesson 2/`

## Next Build Steps

1. Add a lightweight local server command (or npm script) for easy startup.
2. Add backend persistence (database + auth + roles).
3. Track learner progress and test history per user.
4. Add lesson-level metadata (difficulty, tags, estimated duration).
