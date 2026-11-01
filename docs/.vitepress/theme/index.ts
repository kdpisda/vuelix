import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import CatalogGrid from './components/CatalogGrid.vue'
import ComponentPreview from './components/ComponentPreview.vue'
import InstallTabs from './components/InstallTabs.vue'
import SiteCredit from './components/SiteCredit.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  // The default footer only shows on pages without a sidebar; credit every doc page too.
  Layout: () => h(DefaultTheme.Layout, null, { 'doc-after': () => h(SiteCredit) }),
  enhanceApp({ app }) {
    app.component('CatalogGrid', CatalogGrid)
    app.component('ComponentPreview', ComponentPreview)
    app.component('InstallTabs', InstallTabs)
  },
} satisfies Theme
