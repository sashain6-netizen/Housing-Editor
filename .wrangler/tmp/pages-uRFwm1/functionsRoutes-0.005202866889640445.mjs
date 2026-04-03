import { onRequestPost as __api_auth_login_js_onRequestPost } from "C:\\Projects\\Housing Editor\\functions\\api\\auth\\login.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "C:\\Projects\\Housing Editor\\functions\\api\\auth\\me.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "C:\\Projects\\Housing Editor\\functions\\api\\auth\\register.js"
import { onRequestGet as __api_health_js_onRequestGet } from "C:\\Projects\\Housing Editor\\functions\\api\\health.js"
import { onRequest as __api_test_js_onRequest } from "C:\\Projects\\Housing Editor\\functions\\api\\test.js"
import { onRequest as __api_index_js_onRequest } from "C:\\Projects\\Housing Editor\\functions\\api\\index.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestPost],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_health_js_onRequestGet],
    },
  {
      routePath: "/api/test",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_test_js_onRequest],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_index_js_onRequest],
    },
  ]