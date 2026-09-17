import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Career ships as a subpath of fastbilly.com at /career/.
// The base path is baked into asset URLs at build time so it must match the
// mount point on the production site.
export default defineConfig({
  base: '/career/',
  plugins: [react()],
});
