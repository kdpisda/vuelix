import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ComponentPreview from './components/ComponentPreview.vue'
import InstallTabs from './components/InstallTabs.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ComponentPreview', ComponentPreview)
    app.component('InstallTabs', InstallTabs)
  },
} satisfies Theme
