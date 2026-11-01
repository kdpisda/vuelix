import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'

interface CatalogItem { name: string, title: string, category: string }

const catalog: CatalogItem[] = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../registry/catalog.json', import.meta.url)), 'utf8'),
)

const categoryOrder = ['Primitives', 'Text & Numbers', 'Surfaces', 'Navigation', 'Feedback', 'Forms', 'Data Display', 'Charts']
const componentSidebar = categoryOrder
  .map(category => ({
    text: category,
    items: catalog
      .filter(c => c.category === category)
      .map(c => ({ text: c.title, link: `/components/${c.name}` })),
  }))
  .filter(group => group.items.length)

const gettingStarted = {
  text: 'Getting Started',
  items: [
    { text: 'Introduction', link: '/docs/' },
    { text: 'Installation', link: '/docs/installation' },
    { text: 'Theming', link: '/docs/theming' },
    { text: 'Motion Patterns', link: '/docs/motion' },
    { text: 'All Components', link: '/components/' },
  ],
}

export default defineConfig({
  title: 'vuelix',
  description: 'Animated, copy-paste components for Vue — built on Tailwind CSS and Motion.',
  cleanUrls: true,
  sitemap: { hostname: 'https://vuelix.dev' },
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#10b981' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Docs', link: '/docs/', activeMatch: '^/docs/' },
      { text: 'Components', link: '/components/', activeMatch: '^/components/' },
    ],
    sidebar: {
      '/docs/': [gettingStarted, ...componentSidebar],
      '/components/': [gettingStarted, ...componentSidebar],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/kdpisda/vuelix' }],
    search: { provider: 'local' },
    outline: [2, 3],
    footer: {
      message: 'Released under the MIT License. Built with Vue, Tailwind CSS and Motion.',
      copyright: 'Designed by <a href="https://kdpisda.in" target="_blank">Kuldeep Pisda</a>',
    },
  },
  vite: {
    // VitePress bundles Vite 5 while the workspace also has Vite 7 (for the npm package);
    // the plugin works with both, only their type declarations disagree.
    plugins: [tailwindcss() as any],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../registry', import.meta.url)),
      },
    },
    ssr: {
      noExternal: ['motion-v'],
    },
  },
})
