import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv, defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { collectLicenses } from './scripts/generate-licenses.js';

const env = loadEnv('', process.cwd());

// Global flag to ensure licenses are generated only once per build
let licensesGenerated = false;

function copyLangFolderPlugin() {
  let outDir = '';

  return {
    name: 'copy-lang-folder',
    apply: 'build', // Run only during build
    configResolved(config) {
      // Get the output directory from Vite config
      outDir = 'build/';
    },
    async closeBundle() {
      const srcDir = path.resolve(process.cwd(), 'lang');
      const destDir = path.resolve(process.cwd(), outDir, 'lang');

      if (!fs.existsSync(srcDir)) {
        console.warn(`Source folder "lang" not found at: ${srcDir}`);
        return;
      }

      try {
        // Copy the "lang" folder recursively to the destination
        await fs.promises.cp(srcDir, destDir, { recursive: true });
        console.log(`Copied "lang" folder from ${srcDir} to ${destDir}`);
      } catch (error) {
        console.error('Error copying "lang" folder:', error);
      }
    },
  };
}

function copyManifestPlugin(filename = 'manifest.json') {
  let outDir = '';

  return {
    name: 'copy-manifest-json',
    apply: 'build',
    configResolved(config) {
      outDir = 'build/';
    },
    async closeBundle() {
      const srcPath = path.resolve(process.cwd(), filename);
      const destPath = path.resolve(process.cwd(), outDir, filename);

      if (!fs.existsSync(srcPath)) {
        console.warn(`Manifest file not found at: ${srcPath}`);
        return;
      }

      try {
        await fs.promises.copyFile(srcPath, destPath);
        console.log(`Copied manifest from ${srcPath} to ${destPath}`);
      } catch (err) {
        console.error('Failed to copy manifest.json:', err);
      }
    },
  };
}

function generateLicensesPlugin() {
  let outDir = '';

  return {
    name: 'generate-licenses',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(process.cwd(), 'build');
    },
    async closeBundle() {
      // Don't regenerate if file already exists (SSR and client build run in separate processes)
      const licensesPath = path.join(outDir, 'licenses.json');
      if (fs.existsSync(licensesPath)) {
        return;
      }

      // Run only once (closeBundle is called for both SSR and client builds)
      if (!licensesGenerated) {
        licensesGenerated = true;
        try {
          console.log('Generating licenses...');
          // Ensure the build directory exists
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }
          collectLicenses(outDir);
          console.log('Licenses generated successfully.');
        } catch (err) {
          console.error('Failed to generate licenses:', err);
          // Don't fail the build, just warn
        }
      }
    },
  };
}

export default defineConfig(({ isSsrBuild, command }) => {
  return {
    plugins: [sveltekit(), generateLicensesPlugin(), copyLangFolderPlugin(), copyManifestPlugin()],
    ssr: {
      noExternal:
        command === 'build'
          ? true
          : [
              'chart.js',
              '@tiptap/**',
              'prosemirror-**',
              '@tiptap/pm',
              '@jill64/universal-sanitizer',
              '@panomc/sdk',
              'svelte-i18n',
            ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          quietDeps: true,
          silenceDeprecations: ['mixed-decls', 'color-functions', 'global-builtin', 'import'],
        },
      },
    },
    optimizeDeps: {
      include: ['deepmerge', 'svelte-i18n'],
      exclude: ['@panomc/sdk'],
    },
    server: {
      proxy: {
        '/api': env.VITE_API_URL.replace('/api', ''),
        '/panel/api': env.VITE_API_URL.replace('/api', ''),
      },
      allowedHosts: true,
      hmr: {
        path: '/panel/',
      },
    },
    resolve: {
      dedupe: ['svelte', '@panomc/sdk', 'svelte-i18n'],
    },
    build: {
      manifest: true,
      rollupOptions: {
        // Only externalize in the client-side build to support the importmap.
        // We let SSR build handle dependencies normally to avoid node_modules resolution issues.
        ...(isSsrBuild
          ? {}
          : {
              external: (id) => id.startsWith('svelte') || id.startsWith('@panomc/sdk'),
            }),
      },
    },
  };
});
