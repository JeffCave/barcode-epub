FROM gitpod/workspace-full

RUN sudo apt-get update \
    && sudo apt-get install -y firefox
ENV PATH=$PATH:/workspace/barcode-epub/node_modules/.bin


# https://github.com/gitpod-io/workspace-images/blob/master/full/Dockerfile
## The directory relative to your git repository that will be served by Apache / Nginx
ENV APACHE_DOCROOT_IN_REPO="www"
ENV NGINX_DOCROOT_IN_REPO="www"
