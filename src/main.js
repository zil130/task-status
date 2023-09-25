import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VDataTable } from 'vuetify/labs/VDataTable';
import ru from 'vuetify/lib/locale/ru';
import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';
import App from './App.vue';

const app = createApp(App);

const vuetify = createVuetify({
  components: {
    ...components,
    VDataTable,
  },
  directives,
  lang: {
    locales: { ru },
    current: 'ru',
  },
});

app.use(vuetify).mount('#app');
