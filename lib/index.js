/*!
 * track-requests
 * Copyright(c) 2020 Omar Ghorbel
 * MIT Licensed
 */
'use strict';

const Tracker = require('./tracker');

const requestsTracker = (opts) => {
  const tracker = new Tracker(opts);
  tracker.esClient.healthCheck()
    .then(() => {
      return tracker.esClient.getMapping();
    }).catch((err) => {
      tracker.active = false;
      tracker.logger('track-requests is disabled', err);
    });
  return function(req, res, next) {
    const start = Date.now();
    res.once('finish', function() {
      if (tracker.active) {
        const trackingDoc = tracker.generateTrackingDoc(req, res, start);
        tracker.esClient.insertDocument(trackingDoc);
      }
    });
    next();
  };
};

module.exports = requestsTracker;