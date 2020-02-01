'use strict';

const Tracker = require('../lib/tracker');
const assert = require('assert');

describe('tracker basic Tests', () => {

  const options = {
    elasticSearchOptions: {
      elasticSearchUrl: 'http://127.0.0.1:9200/',
      indexName: 'test-tracking'
    },
    routesToIgnore: [/user/, '/organization/member', {url: '/healthcheck', method: 'GET'}, {regex: /search/, method: 'POST', statusCode: 404}]
  };
  const tracker = new Tracker(options);

  it('generateTrackingDoc GET request example', (done) => {
    let req = {url: '/test', method: 'GET', headers: {'user-agent': 'scraper', 'x-real-ip': '127.0.0.1'}};
    let res = {statusCode: 200};
    let startTime = Date.now();
    let doc = tracker.generateTrackingDoc(req, res, startTime);
    let expectedDoc = {
      url: req.url,
      method: req.method,
      user: 'anonymous',
      ip: req.headers['x-real-ip'],
      statusCode: res.statusCode,
      processingTime: 0,
      createdAt: startTime,
      userAgent: req.headers['user-agent'],
      error: null,
      body: null
    };
    assert.deepEqual(expectedDoc, doc);

    done();
  });

  it('generateTrackingDoc POST request example', (done) => {
    let req = {url: '/test', method: 'POST', body: {name: 'fartas'}, headers: {'user-agent': 'scraper', 'x-real-ip': '127.0.0.1'}};
    let res = {statusCode: 200};
    let startTime = Date.now();
    let doc = tracker.generateTrackingDoc(req, res, startTime);
    let expectedDoc = {
      url: req.url,
      method: req.method,
      user: 'anonymous',
      ip: req.headers['x-real-ip'],
      statusCode: res.statusCode,
      processingTime: 0,
      createdAt: startTime,
      userAgent: req.headers['user-agent'],
      body: req.body,
      error: null
    };
    assert.deepEqual(doc, expectedDoc);

    done();
  });

  it('generateTrackingDoc err request example', (done) => {
    let req = {url: '/test', method: 'POST', body: {name: 'fartas'}, headers: {'user-agent': 'scraper', 'x-real-ip': '127.0.0.1'}, error: 'internal error'};
    let res = {statusCode: 500};
    let startTime = Date.now();
    let doc = tracker.generateTrackingDoc(req, res, startTime);
    let expectedDoc = {
      url: req.url,
      method: req.method,
      user: 'anonymous',
      ip: req.headers['x-real-ip'],
      statusCode: res.statusCode,
      processingTime: 0,
      createdAt: startTime,
      userAgent: req.headers['user-agent'],
      body: req.body,
      error: req.error
    };
    assert.deepEqual(expectedDoc, doc);

    done();
  });

  it('shouldIgnoreRoutes should match regex', (done) => {
    let req = {url: '/test/user', method: 'POST', headers: {}};
    let res = {statusCode: 201};
    let result = tracker.shouldIgnoreRoutes(req, res);
    assert(result);
    done();
  });

  it('shouldIgnoreRoutes should not match', (done) => {
    let req = {url: '/organization/members', method: 'POST', headers: {}};
    let res = {statusCode: 201};
    let result = tracker.shouldIgnoreRoutes(req, res);
    assert(!result);
    done();
  });

  it('shouldIgnoreRoutes should match string', (done) => {
    let req = {url: '/organization/member', method: 'POST', headers: {}};
    let res = {statusCode: 201};
    let result = tracker.shouldIgnoreRoutes(req, res);
    assert(result);
    done();
  });

  it('shouldIgnoreRoutes should not match object', (done) => {
    let req = {url: '/healthcheck', method: 'POST', headers: {}};
    let res = {statusCode: 201};
    let result = tracker.shouldIgnoreRoutes(req, res);
    assert(!result);
    done();
  });

  it('shouldIgnoreRoutes should match object', (done) => {
    let req = {url: '/healthcheck', method: 'GET', headers: {}};
    let res = {statusCode: 201};
    let result = tracker.shouldIgnoreRoutes(req, res);
    assert(result);
    done();
  });

  it('shouldIgnoreRoutes should not match object with regex', (done) => {
    let req = {url: '/search', method: 'POST', headers: {}};
    let res = {statusCode: 401};
    let result = tracker.shouldIgnoreRoutes(req, res);
    assert(!result);
    done();
  });

  it('shouldIgnoreRoutes should match object with regex', (done) => {
    let req = {url: '/search', method: 'POST', headers: {}};
    let res = {statusCode: 404};
    let result = tracker.shouldIgnoreRoutes(req, res);
    assert(result);
    done();
  });

});

describe('tracker custom Getters Tests', () => {

  const options = {
    elasticSearchOptions: {
      elasticSearchUrl: 'http://127.0.0.1:9200/',
      indexName: 'test-tracking'
    },
    getters: {
      getUser: (req) => req.user && req.user.id || 'sankou7',
      getIp: (req) => req.ip,
      getErrorMessage: (req, res) => res.error,
      getExtraFields: (req) => {
        return {
          params: req.params,
          query: req.query,
          hello: 'hello ' + (req.user && req.user.id || 'sankou7')
        };
      }
    }
  };

  const tracker = new Tracker(options);

  it('generateTrackingDoc GET request example', (done) => {
    let req = {url: '/test', method: 'GET', ip: '8.8.8.8', user: {id: 'balbaz'}, headers: {'user-agent': 'scraper', 'x-real-ip': '127.0.0.1'}};
    let res = {statusCode: 200};
    let startTime = Date.now();
    let doc = tracker.generateTrackingDoc(req, res, startTime);
    let expectedDoc = {
      url: req.url,
      method: req.method,
      user: 'balbaz',
      ip: req.ip,
      statusCode: res.statusCode,
      processingTime: 0,
      createdAt: startTime,
      userAgent: req.headers['user-agent'],
      error: undefined,
      body: undefined,
      query: undefined,
      params: undefined,
      hello: 'hello balbaz'
    };
    assert.deepEqual(expectedDoc, doc);

    done();
  });

  it('generateTrackingDoc POST request example', (done) => {
    let req = {
      url: '/test', method: 'GET', ip: '8.8.8.8', headers: {'user-agent': 'scraper', 'x-real-ip': '127.0.0.1'},
      body: {ok: 'ok'},
      params: {ok: 'not ok'},
      query: {id: 1}
    };
    let res = {statusCode: 200};
    let startTime = Date.now();
    let doc = tracker.generateTrackingDoc(req, res, startTime);
    let expectedDoc = {
      url: req.url,
      method: req.method,
      user: 'sankou7',
      ip: req.ip,
      statusCode: res.statusCode,
      processingTime: 0,
      createdAt: startTime,
      userAgent: req.headers['user-agent'],
      error: undefined,
      body: req.body,
      query: req.query,
      params: req.params,
      hello: 'hello sankou7'
    };
    assert.deepEqual(expectedDoc, doc);

    done();
  });

  it('generateTrackingDoc err request example', (done) => {
    let req = {
      url: '/test', method: 'GET', ip: '8.8.8.8', headers: {'user-agent': 'scraper', 'x-real-ip': '127.0.0.1'},
      body: {ok: 'ok'},
      params: {ok: 'not ok'},
      query: {id: 1}
    };
    let res = {statusCode: 404, error: 'balbaz not found'};
    let startTime = Date.now();
    let doc = tracker.generateTrackingDoc(req, res, startTime);
    let expectedDoc = {
      url: req.url,
      method: req.method,
      user: 'sankou7',
      ip: req.ip,
      statusCode: res.statusCode,
      processingTime: 0,
      createdAt: startTime,
      userAgent: req.headers['user-agent'],
      error: 'balbaz not found',
      body: req.body,
      query: req.query,
      params: req.params,
      hello: 'hello sankou7'
    };
    assert.deepEqual(expectedDoc, doc);

    done();
  });
});