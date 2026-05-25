import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'FFP 家庭财务规划',
  tagline: '多智能体研发流程文档',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',

  organizationName: 'ffp',
  projectName: 'ffp',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          // 指向 ffp 项目内的 docs 目录（单一事实源）
          path: '../docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/your-org/ffp/edit/main/docs-site/',
          // 排除 templates 目录（包含占位符模板，非正式文档）
          exclude: ['**/_templates/**', '**/templates/**', '**/openapi-output/**', '**/test-cases/**', '**/state.md'],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-mermaid', 'docusaurus-theme-plantuml'],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'FFP 文档',
      logo: {
        alt: 'FFP Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '文档',
        },
        {
          href: 'https://github.com/your-org/ffp',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '架构',
              to: '/docs/architecture',
            },
            {
              label: '流程',
              to: '/docs/process',
            },
            {
              label: 'ADR',
              to: '/docs/architecture/decisions',
            },
          ],
        },
      ],
    },
  },
};

export default config;