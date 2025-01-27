import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default defineConfigWithVueTs({
    name: 'app/files-to-lint',
    files: ['**/*.{ts}']
}, {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'eslint.config.ts']
}, pluginVue.configs['flat/essential'], vueTsConfigs.recommended, skipFormatting);
