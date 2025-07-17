import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    },
    deps: {
      inline: ['svelte']
    }
  }
});