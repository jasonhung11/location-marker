// import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import VueGoogleMaps from '@fawmi/vue-google-maps'

import Antd from 'ant-design-vue';
// import process from 'process';
const app = createApp(App);
app.use(VueGoogleMaps, {
    load: {
        key: "AIzaSyBVZZgEDJdHg1eW38hiCdJdn-teUU5ZZSY",
        // language: 'de',
    },
}).use(Antd).mount('#app')