'use strict';
const ElasticSearchClient = require('./elasticSearchClient');

class Tracker {

  constructor(opts = {getters: {}}) {
    this.active = true;
    this.logger = opts.logger || console.error;
    this.routesToIgnore = opts.routesToIgnore || [];
    this.endpointsBodies = opts.endpointsBodies || [];
    this.getters = {
      getUrl: (req) => req.url,
      getMethod: (req) => req.method,
      getUser: () => 'anonymous',
      getIp: (req) => req.headers['x-real-ip'],
      getStatusCode: (req, res) => res.statusCode === 304 ? 200 : res.statusCode,
      getProcessingTime: (startTime) => Date.now() - startTime,
      getCreatedAt: Date.now,
      getErrorMessage: (req) => req.error,
      getUserAgent: (req) => req.headers['user-agent'],
      getBody: (req) => req.body,
      ...opts.getters
    };

    this.esClient = opts.dbClient || new ElasticSearchClient({...opts.elasticSearchOptions, logger: this.logger});

    this.generateTrackingDoc = opts.generateTrackingDoc || (
      (req, res, startTime) => {
        try {
          let trackingDoc = {
            url: this.getters.getUrl(req, res),
            method: this.getters.getMethod(req, res),
            user: this.getters.getUser(req, res),
            ip: this.getters.getIp(req, res),
            statusCode: this.getters.getStatusCode(req, res),
            processingTime: this.getters.getProcessingTime(startTime),
            createdAt: this.getters.getCreatedAt(req, res),
            error: this.getters.getErrorMessage(req, res),
            userAgent: this.getters.getUserAgent(req, res),
            body: this.getters.getBody(req, res),
            ...opts.getters && opts.getters.getExtraFields && opts.getters.getExtraFields(req, res)
          };

          return trackingDoc;
        } catch (err) {
          this.logger('track-requests: cannot generate tracking doc', err);
        }
      }
    );

    this.shouldIgnoreRoutes = (req, res) => {
      let url = this.getters.getUrl(req, res);
      return this.routesToIgnore.some((filter) => {
        if (filter instanceof RegExp)
          return filter.test(url);
        if (typeof filter == 'object')
          return (!filter.url || filter.url == url) && (!filter.regex || filter.regex.test(url)) && (!filter.method || filter.method == this.getters.getMethod(req))
            && (!filter.statusCode || filter.statusCode && filter.statusCode == this.getters.getStatusCode(req, res));

        return filter == url;

      });
    };

    this.verifyBody = (req, res, rawBody) => {
      let url = this.getters.getUrl(req, res);
      for (let counter = 0; counter < this.endpointsBodies.length; counter++) {
        let fullFilter = this.endpointsBodies[counter];
        let filter = fullFilter.endpoint;

        let properties = fullFilter.body;
        if (filter instanceof RegExp && filter.test(url)) {
          return this.setBody(rawBody, properties);
        }
        if (typeof filter == 'object' && (!filter.url || filter.url === url) && (!filter.regex || filter.regex.test(url)) && (!filter.method || filter.method === this.getters.getMethod(req))
          && (!filter.statusCode || filter.statusCode && filter.statusCode === this.getters.getStatusCode(req, res))) {
          return this.setBody(rawBody, properties);
        }
        if (filter === url) {
          return this.setBody(rawBody, properties);
        }

      }
      return rawBody;
    };

    this.setBody = (rawBody, properties) => {
      let cleanBody = {};
      if (properties.keep) {
        properties.properties.forEach((property) => {
          cleanBody[property] = rawBody[property] ? rawBody[property] : null;
        });
      } else {
        cleanBody = rawBody;
        properties.properties.forEach((property) => {
          if (cleanBody[property]) delete cleanBody[property];
        });
      }
      return cleanBody;
    };
  }

}


module.exports = Tracker;