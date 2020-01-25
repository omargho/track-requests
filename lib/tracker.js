'use strict';
const ElasticSearchClient = require('./elasticSearchClient');

class Tracker {

  constructor(opts = {getters: {}}) {
    this.active = true;
    this.logger = opts.logger || console.error;
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

    this.esClient = opts.dbClient || new ElasticSearchClient(opts.elasticSearchOptions);

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
  }
}

module.exports = Tracker;