FROM gitpod/workspace-full

RUN sudo apt-get update \
    && sudo apt-get install -y libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev \
    && npm install -g eslint
ENV PATH=$PATH:/workspace/barcode-epub/node_modules/.bin


# https://github.com/gitpod-io/workspace-images/blob/master/full/Dockerfile
## The directory relative to your git repository that will be served by Apache / Nginx
ENV APACHE_DOCROOT_IN_REPO="www"
ENV NGINX_DOCROOT_IN_REPO="www"
