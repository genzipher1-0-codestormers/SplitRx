FROM nginx:alpine

# Install openssl
RUN apk add --no-cache openssl

# Create directory for certs
RUN mkdir -p /etc/nginx/certs

# Generate self-signed certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/self-signed.key \
    -out /etc/nginx/certs/self-signed.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=splitrx.kvinda.qzz.io"

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom config
COPY default.conf /etc/nginx/conf.d/
