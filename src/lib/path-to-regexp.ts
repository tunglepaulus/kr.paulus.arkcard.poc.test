import { compile, pathToRegexp } from 'path-to-regexp';

import { API_ROUTE_TYPE, PAGE_ROUTER_TYPE, RouteParams } from '@/constants';

export const pathToUrl = (
  url: API_ROUTE_TYPE | PAGE_ROUTER_TYPE,
  params: RouteParams<PAGE_ROUTER_TYPE> | RouteParams<API_ROUTE_TYPE>
) => {
  const { keys } = pathToRegexp(url);
  // check keys in url has value in params object
  if (keys.every((key: any) => (params as any)[key.name])) {
    // Instead remove unnecessary property in params object, i create a new one and assign the needed key
    const newParams: any = {};
    keys.map((key: any) => {
      const value = (params as any)[key.name];
      newParams[key.name] = typeof value === 'number' ? String(value) : value;
    });
    return compile(url)(newParams);
  }
  return '';
};
