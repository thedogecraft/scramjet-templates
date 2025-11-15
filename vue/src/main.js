import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { createWebHistory, createRouter } from "vue-router";
import Credits from "./pages/credits.vue";
import Home from "./pages/home.vue";

const routes = [
	{ path: "/", component: Home },
	{ path: "/credits", component: Credits },
];

export const router = createRouter({
	history: createWebHistory(),
	routes,
});

createApp(App).use(router).mount("#app");
