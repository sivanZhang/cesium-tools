import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'view-design/dist/styles/iview.css';
import "static/CesiumUnminified/Widgets/widgets.css";
Vue.config.productionTip = false
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')