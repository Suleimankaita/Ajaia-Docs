# Multi-stage build: compile the Vite app, then serve the static output
# with a lightweight nginx image. Keeps the final image small and avoids
# running a Node process just to serve static files in production.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# VITE_API_URL is baked in at build time since Vite env vars are
# resolved at build, not at container runtime.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
