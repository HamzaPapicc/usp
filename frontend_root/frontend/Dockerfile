FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json /app/
RUN npm ci

COPY . /app

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine

# nginx official entrypoint will render /etc/nginx/templates/*.template via envsubst
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80