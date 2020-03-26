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
      tracker.logger('track-requests is disabled.\r\n', err);
    });
  return function(req, res, next) {
    const start = Date.now();
    res.once('finish', function() {
      if (tracker.active && !tracker.shouldIgnoreRoutes(req, res)) {
        const trackingDoc = tracker.generateTrackingDoc(req, res, start);
        if(tracker.shouldSetBody(req, res)){
          let cleanedBody = {};
          Object.keys(tracker.bodyProperties).forEach(key => {
            cleanedBody[key] = trackingDoc.body[key] ? trackingDoc.body[key] : null;
          });
          trackingDoc.body = cleanedBody;
        }
        tracker.esClient.insertDocument(trackingDoc);
      }
    });
    next();
  };
};

module.exports = requestsTracker;