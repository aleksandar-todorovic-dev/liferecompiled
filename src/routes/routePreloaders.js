const shouldSkipRoutePrefetch = () => {
  if (typeof navigator === "undefined") return false;

  return Boolean(navigator.connection?.saveData);
};

const runRoutePreload = (loader) => {
  if (shouldSkipRoutePrefetch()) return;

  void loader();
};

const isFinePointerIntent = (event) => {
  const pointerType = event?.pointerType;

  return !pointerType || pointerType === "mouse" || pointerType === "pen";
};

export const routeLoaders = {
  authAction: () => import("../pages/AuthAction"),
  forgotPassword: () => import("../pages/ForgotPassword"),
  reportIssue: () => import("../pages/ReportIssue"),
  myPosts: () => import("../pages/MyPosts"),
  createPost: () => import("../pages/CreatePost"),
  editPost: () => import("../pages/EditPost"),
  postDetails: () => import("../pages/PostDetails"),
  profile: () => import("../pages/Profile"),
  about: () => import("../pages/About"),
  dashboardLayout: () => import("../pages/dashboard/components/DashboardLayout"),
  savedPosts: () => import("../pages/dashboard/components/saved/SavedPosts"),
  stats: () => import("../pages/dashboard/Stats"),
  trash: () => import("../pages/dashboard/Trash"),
  settings: () => import("../pages/dashboard/settings/Settings"),
  moderationPage: () =>
    import("../pages/dashboard/moderation/ModerationPage"),
};

export const preloadRoutes = {
  authAction: () => runRoutePreload(routeLoaders.authAction),
  forgotPassword: () => runRoutePreload(routeLoaders.forgotPassword),
  reportIssue: () => runRoutePreload(routeLoaders.reportIssue),
  postDetails: () => runRoutePreload(routeLoaders.postDetails),
  profile: () => runRoutePreload(routeLoaders.profile),
  about: () => runRoutePreload(routeLoaders.about),

  dashboardMyPosts: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.myPosts);
  },

  dashboardSaved: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.savedPosts);
  },

  dashboardStats: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.stats);
  },

  dashboardTrash: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.trash);
  },

  dashboardSettings: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.settings);
  },

  dashboardCreate: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.createPost);
  },

  dashboardEdit: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.editPost);
  },

  dashboardModeration: () => {
    runRoutePreload(routeLoaders.dashboardLayout);
    runRoutePreload(routeLoaders.moderationPage);
  },
};

export const getRouteIntentProps = (preloadRoute) => ({
  onPointerEnter: (event) => {
    if (isFinePointerIntent(event)) preloadRoute();
  },
  onFocus: preloadRoute,
});

export const getRouteHoverIntentProps = (preloadRoute) => ({
  onPointerEnter: (event) => {
    if (isFinePointerIntent(event)) preloadRoute();
  },
});

export const getRoutePressIntentProps = (preloadRoute) => ({
  onPointerDown: preloadRoute,
  onFocus: preloadRoute,
});
