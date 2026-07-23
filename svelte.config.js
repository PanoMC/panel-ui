import { createSvelteConfig } from '@panomc/theme-core/kit/svelte-config';

export default await createSvelteConfig(import.meta.url, {
  paths: {
    base: '/panel',
  },
});
