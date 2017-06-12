FROM node

EXPOSE 4000
EXPOSE 5858

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
RUN npm install -g nodemon
ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production
RUN mkdir -p /opt/ghcrawler-dashboard && cp -a /tmp/node_modules /opt/ghcrawler-dashboard/

WORKDIR /opt/ghcrawler-dashboard
ADD . /opt/ghcrawler-dashboard

CMD nodemon --inspect ./bin/www
