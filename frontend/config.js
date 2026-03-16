(function initAppConfig() {
  const { hostname, origin } = window.location;
  const isLocalHost = ['localhost', '127.0.0.1'].includes(hostname);

  const localServices = {
    AUTH_URL: origin,
    TASK_URL: origin,
    USER_URL: origin
  };

  const cloudServices = {
    AUTH_URL: 'https://auth-service-production-5d84.up.railway.app',
    TASK_URL: 'https://task-service-production-ad9b.up.railway.app',
    USER_URL: 'https://user-service-production-e727.up.railway.app'
  };

  const services = isLocalHost ? localServices : cloudServices;

  const endpoints = isLocalHost
    ? {
        register: '/api/auth/register',
        login: '/api/auth/login',
        me: '/api/auth/me',
        myProfile: '/api/users/me',
        tasks: '/api/tasks'
      }
    : {
        register: `${services.AUTH_URL}/api/auth/register`,
        login: `${services.AUTH_URL}/api/auth/login`,
        me: `${services.AUTH_URL}/api/auth/me`,
        myProfile: `${services.USER_URL}/api/users/me`,
        tasks: `${services.TASK_URL}/api/tasks`
      };

  window.APP_CONFIG = {
    ...services,
    MODE: isLocalHost ? 'local' : 'cloud',
    ENDPOINTS: endpoints
  };
})();
