import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import App from './App.vue'
import router from './router'
import './style.css'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
