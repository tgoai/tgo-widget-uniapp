import { pages, subPackages } from 'virtual:uni-pages'

function generateRoutes() {
  const routes = pages.map((page) => {
    const newPath = `/${page.path}`
    return { ...page, path: newPath }
  })
  if (subPackages && subPackages.length > 0) {
    subPackages.forEach((subPackage) => {
      const subRoutes = subPackage.pages.map((page: any) => {
        const newPath = `/${subPackage.root}/${page.path}`
        return { ...page, path: newPath }
      })
      routes.push(...subRoutes)
    })
  }
  return routes
}

const router = createRouter({
  routes: generateRoutes(),
})

router.beforeEach((to, from, next) => {
  console.log('🚀 beforeEach 守卫触发:', { to, from })

  // 基本的导航日志记录
  if (to.path && from.path) {
    console.log(`📍 导航: ${from.path} → ${to.path}`)
  }

  next()
})

router.afterEach((to, from) => {
  console.log('🎯 afterEach 钩子触发:', { to, from })

  // 简单的页面切换记录
  if (to.path) {
    console.log(`📄 页面切换完成: ${to.path}`)
  }
})

export default router
