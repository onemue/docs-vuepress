module.exports = {
  title: "ONEMUE Docs",
  description: "This is a Docs.",
  base: '/docs/',
  plugins: {
      'permalink-pinyin': {
        separator: '-'
      },
      'autobar': {
        rootDir: 'docs',
        stripNumbers: true,
        maxLevel: 2,
        navPrefix: "nav",
        skipEmptySidebar: true,
        skipEmptyNavbar: true,
        multipleSideBar: true,
        setHomepage: 'hide' | 'toGroup' | 'top',
        pinyinNav: true
      },
      'fulltext-search': {},
  },
  markdown: {
    toc: {
      includeLevel:[1, 2, 3, 4, 5, 6],
      lineNumbers: true // 代码块显示行号
    }
  },
  themeConfig: {
    nav:[ // 导航栏配置
     
    ],
    // sidebar: autoGetSidebarOptionBySrcDir, // 侧边栏配置
    // sidebarDepth: 'auto', // 侧边栏显示2级
  }
}
