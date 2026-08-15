import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import App from './App.vue';
import router from './router';
import './styles/tokens.css';
import './styles/global.css';

// 玻璃暗色主题
document.documentElement.classList.add('dark');

createApp(App).use(router).use(ElementPlus, { locale: zhCn }).mount('#app');
