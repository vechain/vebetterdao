# Translate Skill

Manages translation files in `apps/frontend/src/i18n/languages/`.

## Translation Files

- 15 languages: en (source), de, es, fr, hi, it, ja, ko, nl, pt, sv, tr, tw, vi, zh
- Format: flat JSON key-value pairs (keys = English phrases)
- Interpolation: `{{variableName}}`
- Library: `react-i18next` configured in `apps/frontend/src/i18n/index.tsx`
- Language list defined in `apps/frontend/src/i18n/index.tsx` (`languages` array)

## When Adding New Translation Keys

1. Add the new key to `en.json` with the English value
2. Add the same key to ALL other language files with the correct translation for the language of the file
3. After adding to all files, sort ALL translation files alphabetically by key (case-insensitive)

## When Removing Translation Keys

1. Remove the key from ALL 15 language files
2. Files should remain sorted after removal

## Sorting Rules

- All translation JSON files MUST have keys sorted alphabetically (case-insensitive)
- Sorting applies to ALL language files, not just `en.json`
- After any modification, verify keys are sorted

## Sort Procedure

For each `.json` file in `apps/frontend/src/i18n/languages/`:

1. Parse the JSON
2. Get all keys and sort them case-insensitively
3. Rebuild the object with sorted keys
4. Write back with 2-space indentation and trailing newline

Use a Node.js script or jq to sort. Example with Node.js:

```bash
node -e "
const fs = require('fs');
const glob = require('glob');
const files = glob.sync('apps/frontend/src/i18n/languages/*.json');
files.forEach(f => {
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  const sorted = Object.keys(obj)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .reduce((acc, key) => { acc[key] = obj[key]; return acc; }, {});
  fs.writeFileSync(f, JSON.stringify(sorted, null, 2) + '\n');
});
"
```

## Sync Check

After any translation change, verify:

- `en.json` has all keys that exist in code (search for `t("..."`) usage)
- All non-English files have the EXACT same keys as `en.json`
- Missing keys in non-English files get the correct translation for the language of the file
- Extra keys in non-English files (not in `en.json`) should be removed
- All files are sorted alphabetically by key

## Fixed Words

Some words should NOT be translated (kept as-is). See `apps/frontend/src/i18n/fixedWords.json` for the list. The list is grouped by language and then by word.
example:

```json
{
  "all": {
    "B3TR": "B3TR",
    "VOT3": "VOT3",
    "B3MO": "B3MO"
  },
  "it": {
    "round": "round"
  }
}
```
