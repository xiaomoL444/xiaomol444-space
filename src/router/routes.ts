import type { RouteRecordRaw } from 'vue-router'
import { homeSections } from '../data/sections'
import HomeView from '../views/HomeView.vue'
import SectionView from '../views/SectionView.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView, meta: { title: '个人主页' } },
  ...homeSections.map((section) => ({
    path: section.path,
    name: section.id,
    component: SectionView,
    props: { title: section.title, englishTitle: section.englishTitle },
    meta: { title: section.title },
  })),
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
