FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci && \
    ROLLUP_VERSION=$(node -p "require('./node_modules/rollup/package.json').version") && \
    npm install --no-save "@rollup/rollup-linux-x64-musl@${ROLLUP_VERSION}"

COPY . .

RUN npm run build


FROM nginx:stable-alpine3.23-slim

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

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 7070

CMD ["nginx", "-g", "daemon off;"]