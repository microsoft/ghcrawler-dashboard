FROM node:8

LABEL maintainer="opensource@microsoft.com"\
  vendor="Microsoft"\
  com.microsoft.product="GHCrawler Dashboard"\
  com.microsoft.url="https://hub.docker.com/r/microsoft/ghcrawler-dashboard"\
  com.microsoft.vcs-url="https://github.com/Microsoft/ghcrawler-dashboard"

EXPOSE 4000
EXPOSE 5858

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production
RUN mkdir -p /opt/ghcrawler-dashboard && cp -a /tmp/node_modules /opt/ghcrawler-dashboard/

WORKDIR /opt/ghcrawler-dashboard
ADD . /opt/ghcrawler-dashboard

CMD ["npm", "start"]