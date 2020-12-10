import VueRouter from 'vue-router';


function guardRoute(to, from, next)
{
  if( window.localStorage.getItem('accessToken') ) {
    next();
  } else {
    next('/');
  }
}

const routes = [
  {
    name: 'landing',
    path: '/',
    component: () => import(/* webpackChunkName: "Landing" */ './pages/Landing'),
  },
  {
    name: 'privacy_policy',
    path: '/privacy_policy',
    component: () => import(/* webpackChunkName: "Landing" */ './pages/PrivacyPolicy'),
  },
  {
    name: 'landing',
    path: '/INSEAD',
    component: () => import(/* webpackChunkName: "Landing" */ './pages/Landing'),
  },
  {
    name: 'signup',
    path: '/signup',
    beforeEnter: guardRoute,
    component: () => import(/* webpackChunkName: "Landing" */ './pages/Signup.vue'),
    props: (route) => {
      return { mode: route.query.mode };
    },
  },
  {
    path: '/index.html',
    redirect: '/'
  },
  {
    name: 'profile',
    path: '/profile',
    beforeEnter: guardRoute,
    component: () => import(/* webpackChunkName: "Profile" */ './pages/Profile.vue'),
  },
  {
    name: 'deposit',
    path: '/deposit',
    beforeEnter: guardRoute,
    component: () => import(/* webpackChunkName: "Profile" */ './pages/Deposit.vue'),
  },
  {
    name: 'wallet',
    path: '/wallet',
    beforeEnter: guardRoute,
    component: () => import(/* webpackChunkName: "Profile" */ './pages/Wallet.vue'),
  },
  {
    name: 'Help page',
    path: '/help-page',
    beforeEnter: guardRoute,
    component: () => import(/* webpackChunkName: "Profile" */ './pages/HelpPage.vue'),
  },
  {
    name: 'withdraw',
    path: '/withdraw',
    beforeEnter: guardRoute,
    component: () => import(/* webpackChunkName: "Profile" */ './pages/Withdraw.vue'),
  },
  {
    name: 'settings',
    path: '/settings',
    beforeEnter: guardRoute,
    component: () => import(/* webpackChunkName: "Profile" */ './pages/Settings.vue'),
  },
  {
    name: 'confirmEmail',
    path: '/confirmEmail',
    component: () => import(/* webpackChunkName: "Profile" */ './pages/ConfirmEmail.vue'),
  },
  {
    name: 'forgotPassword',
    path: '/reset-password',
    component: () => import('./pages/ForgotPassword'),
  },
  {
    name: 'newPassword',
    path: '/password/:token',
    component: () => import('./pages/Password'),
  }
];

const router = new VueRouter({
  mode: 'history',
  routes,
});

router.beforeEach(async (to, from, next) => {
  const refereeUserId = to.query.ref;
  if (refereeUserId) {
    await window.localStorage.setItem('refereeUserId', refereeUserId);
  }
  next();
});

export default router;
