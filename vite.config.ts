import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        register: resolve(__dirname, 'register.html'),
        homepage: resolve(__dirname, 'homepage.html'),
        editor: resolve(__dirname, 'createDungeon.html'),
        game: resolve(__dirname, 'dungeonGame.html')
      }
    }
  }
});