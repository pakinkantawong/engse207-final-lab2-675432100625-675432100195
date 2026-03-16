FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY logs.html /usr/share/nginx/html/logs.html
COPY config.js /usr/share/nginx/html/config.js

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
