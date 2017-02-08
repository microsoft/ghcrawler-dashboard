FROM node

EXPOSE 4000
EXPOSE 5858

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
RUN npm install -g nodemon
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/crawler-dashboard && cp -a /tmp/node_modules /opt/crawler-dashboard/

WORKDIR /opt/crawler-dashboard
ADD . /opt/crawler-dashboard

CMD nodemon --debug ./bin/www