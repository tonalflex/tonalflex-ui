import { createRouter, createWebHistory } from 'vue-router';
import LoadingScreen from '@/views/LoadingScreen.vue';
import Dashboard from '@/views/AppDashboard.vue';

const routes = [
  {
    path: '/',
    name: 'Loading',
    component: LoadingScreen,
  },
  {
    path: '/dashboard',
    name: 'AppDashboard',
    component: Dashboard,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
