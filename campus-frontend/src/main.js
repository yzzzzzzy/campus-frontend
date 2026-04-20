import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 引入 Element Plus UI 框架和它的样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 👉 [新增] 引入我们刚才写的路由器
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 告诉 Vue 使用 Element Plus
app.use(ElementPlus)
// 👉 [新增] 告诉 Vue 使用路由器
app.use(router)

// 挂载到页面上
app.mount('#app')