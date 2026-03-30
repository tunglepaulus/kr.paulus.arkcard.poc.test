export const API_ROUTES = {
  AUTH: {
    SIGN_UP: '/auth/signup',
    VERIFY_EMAIL: '/auth/verify-email',
    REFRESH: '/auth/refresh-token',
    VERIFY: '/auth/verify',
    RESEND_VERIFICATION: '/auth/resend-verification',
    LOGIN: '/auth/login',
  },
  ACCOUNT: {
    PROFILE: '/api/accounts/profile',
    UPDATE_CURRENT_COMPANY_NAME: '/api/accounts/update-current-company-name',
    UPDATE_NAME: '/api/accounts/update-name',
    UPDATE_CURRENT_JOB_TITLE: '/api/accounts/update-current-job-title',
    UPDATE_PICTURE: '/api/accounts/profile/update-picture',
    PRESIGNED_UPLOAD: '/api/accounts/profile/presigned-upload',
  },
  CARD: {
    CONNECTED_USERS: '/api/cards/connected-users',
  },
  JURY_EXPERIENCE: {
    JURY_EXPERIENCES: '/jury-experiences',
    JURY_EXPERIENCES_BULK: '/jury-experiences/bulk',
    UPDATE_DETAIL: '/jury-experiences/:id',
  },
} as const;

export const PAGE_ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    ONBOARDING: '/onboarding',
    FORGOT_PASSWORD: '/forgot-password',
    AUTH_CALLBACK: '/auth/callback',
    USER_PROFILE: '/user/:uuid',
  },
  PRIVATE: {
    HOME: '/',
  },
} as const;

// Get the types of values for the PUBLIC and PRIVATE properties
type PublicRoutes = typeof PAGE_ROUTES.PUBLIC;
type PrivateRoutes = typeof PAGE_ROUTES.PRIVATE;

type AllRoutes = PublicRoutes & PrivateRoutes;

type NestedValueOf<T> = T extends object ? { [K in keyof T]: NestedValueOf<T[K]> }[keyof T] : T;

export type API_ROUTE_TYPE = NestedValueOf<typeof API_ROUTES>;

export type PAGE_ROUTER_TYPE =
  (typeof PAGE_ROUTES)['PRIVATE'][keyof (typeof PAGE_ROUTES)['PRIVATE']];

type ExtractRouteParams<T extends string> = T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string | number }
  : T extends `${infer Start}:${infer Param}`
    ? { [K in Param]: string | number }
    : Record<string, never>;

export type RouteParams<T extends PAGE_ROUTER_TYPE | API_ROUTE_TYPE> = ExtractRouteParams<T>;

export const ALL_ROUTES: AllRoutes = (() => {
  return Object.values(PAGE_ROUTES).reduce((prev, next) => {
    return { ...prev, ...next };
  }, {} as any);
})();
