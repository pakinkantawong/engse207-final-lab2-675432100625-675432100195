(function initAppConfig() {
  const { protocol, hostname } = window.location;
  const isLocal = ['localhost', '127.0.0.1'].includes(hostname);
  const baseProtocol = protocol === 'http:' || protocol === 'https:' ? protocol : 'http:';

  window.APP_CONFIG = {
    AUTH_URL: isLocal ? `${baseProtocol}//${hostname}:3001` : 'https://auth-service-production-5d84.up.railway.app',
    TASK_URL: isLocal ? `${baseProtocol}//${hostname}:3002` : 'https://task-service-production-ad9b.up.railway.app',
    USER_URL: isLocal ? `${baseProtocol}//${hostname}:3003` : 'https://user-service-production-e727.up.railway.app'
  };
})();
