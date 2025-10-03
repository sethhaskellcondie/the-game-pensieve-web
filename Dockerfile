# Multi-stage build for Angular application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npx ng build --configuration production

# Production stage
FROM nginx:alpine

# Copy built application from build stage (Angular 17 outputs to browser subdirectory)
COPY --from=build /app/dist/the-game-pensive-web/browser /usr/share/nginx/html

# Remove default nginx configuration and add our custom one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]