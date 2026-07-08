FROM node:22.22-alpine3.24 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM nginx:stable-alpine3.23-slim

COPY --from=build /app/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf '%s\n' \
    'server {' \
    '    listen 7070;' \
    '    server_name _;' \
    '' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '' \
    '    location /health {' \
    '        access_log off;' \
    '        return 200 "healthy";' \
    '        add_header Content-Type text/plain;' \
    '    }' \
    '' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '}' \
    > /etc/nginx/conf.d/default.conf

EXPOSE 7070

CMD ["nginx", "-g", "daemon off;"]