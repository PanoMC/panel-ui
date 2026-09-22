/**
 * The in-browser editor of the file manager (SM-31).
 *
 * CodeMirror 6 is a few hundred kilobytes, and the only page that needs it is the file
 * manager — so everything here sits behind one dynamic `import()`. The module itself is
 * tiny and safe to import statically; the bundle is only fetched when [createFileEditor]
 * is first called, and the promise is cached so opening a second file is instant.
 */

import { EditorLanguages } from '$lib/files.util.js';

/** @type {Promise<object> | null} */
let bundlePromise = null;

/**
 * @returns {Promise<object>} every CodeMirror module the editor uses, loaded once.
 */
function loadBundle() {
  if (!bundlePromise) {
    bundlePromise = Promise.all([
      import('@codemirror/state'),
      import('@codemirror/view'),
      import('@codemirror/language'),
      import('@codemirror/lang-json'),
      import('@codemirror/lang-yaml'),
      import('@codemirror/legacy-modes/mode/properties'),
      import('@codemirror/legacy-modes/mode/toml'),
      import('@codemirror/theme-one-dark'),
      import('codemirror'),
    ]).then(([state, view, language, json, yaml, properties, toml, oneDark, codemirror]) => ({
      state,
      view,
      language,
      json,
      yaml,
      properties,
      toml,
      oneDark,
      codemirror,
    }));
  }

  return bundlePromise;
}

/**
 * @param {object} bundle
 * @param {string} language one of `EditorLanguages`.
 * @returns {import('@codemirror/state').Extension}
 */
function languageExtension(bundle, language) {
  const { StreamLanguage } = bundle.language;

  switch (language) {
    case EditorLanguages.JSON:
      return bundle.json.json();
    case EditorLanguages.YAML:
      return bundle.yaml.yaml();
    case EditorLanguages.PROPERTIES:
      return StreamLanguage.define(bundle.properties.properties);
    case EditorLanguages.TOML:
      return StreamLanguage.define(bundle.toml.toml);
    default:
      return [];
  }
}

/**
 * Mounts a CodeMirror editor into `parent`.
 *
 * Theme, language and read-only are compartments rather than a fresh editor per change, so
 * switching the panel between dark and light (or opening a second file) keeps the scroll
 * position and the undo history.
 *
 * @param {{
 *   parent: HTMLElement,
 *   doc?: string,
 *   language?: string,
 *   dark?: boolean,
 *   readOnly?: boolean,
 *   onChange?: (value: string) => void,
 *   onSave?: () => void,
 * }} options
 * @returns {Promise<{
 *   getValue: () => string,
 *   setDoc: (value: string) => void,
 *   setLanguage: (language: string) => void,
 *   setDark: (dark: boolean) => void,
 *   setReadOnly: (readOnly: boolean) => void,
 *   focus: () => void,
 *   destroy: () => void,
 * }>}
 */
export async function createFileEditor({
  parent,
  doc = '',
  language = EditorLanguages.TEXT,
  dark = true,
  readOnly = false,
  onChange,
  onSave,
}) {
  const bundle = await loadBundle();
  const { Compartment, EditorState, Prec } = bundle.state;
  const { EditorView, keymap } = bundle.view;
  const { basicSetup } = bundle.codemirror;

  const languageCompartment = new Compartment();
  const themeCompartment = new Compartment();
  const readOnlyCompartment = new Compartment();

  // The panel's light theme is CodeMirror's own default, so only the dark one needs a theme.
  const themeFor = (isDark) => (isDark ? bundle.oneDark.oneDark : []);

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        basicSetup,
        // basicSetup binds Mod-s to nothing, but the browser does — highest precedence keeps
        // "save this page" away from the file the admin is editing.
        Prec.highest(
          keymap.of([
            {
              key: 'Mod-s',
              preventDefault: true,
              run: () => {
                onSave?.();

                return true;
              },
            },
          ]),
        ),
        languageCompartment.of(languageExtension(bundle, language)),
        themeCompartment.of(themeFor(dark)),
        readOnlyCompartment.of([
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
        ]),
        EditorView.theme({
          '&': { height: '100%', fontSize: '0.85rem' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--bs-font-monospace)' },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange?.(update.state.doc.toString());
          }
        }),
      ],
    }),
  });

  return {
    getValue: () => view.state.doc.toString(),
    setDoc(value) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: String(value ?? '') },
      });
    },
    setLanguage(next) {
      view.dispatch({
        effects: languageCompartment.reconfigure(languageExtension(bundle, next)),
      });
    },
    setDark(isDark) {
      view.dispatch({ effects: themeCompartment.reconfigure(themeFor(isDark)) });
    },
    setReadOnly(next) {
      view.dispatch({
        effects: readOnlyCompartment.reconfigure([
          EditorState.readOnly.of(next),
          EditorView.editable.of(!next),
        ]),
      });
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}

/**
 * Whether the panel is currently rendering dark (`data-bs-theme` on `<html>`, the same cue
 * the charts use), falling back to the OS preference.
 *
 * @returns {boolean}
 */
export function isPanelDark() {
  if (typeof document === 'undefined') {
    return true;
  }

  const attribute = document.documentElement.getAttribute('data-bs-theme');

  if (attribute) {
    return attribute === 'dark';
  }

  return (
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );
}

/**
 * Calls `listener` whenever the panel theme flips. Mirrors the observer the charts use.
 *
 * @param {(dark: boolean) => void} listener
 * @returns {() => void} disconnect function.
 */
export function onPanelThemeChange(listener) {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }

  const observer = new MutationObserver(() => listener(isPanelDark()));

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });

  return () => observer.disconnect();
}
