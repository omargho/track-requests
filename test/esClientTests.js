'use strict';

const ElasticSearchClient = require('../lib/elasticSearchClient');
const request = require('request');
const assert = require('assert');

describe('esClient basic Tests', () => {
  const options = {
    elasticSearchUrl: 'http://127.0.0.1:9200/',
    indexName: 'test-tracking'
  };
  const esClient = new ElasticSearchClient(options);

  before(done => {
    //delete ES data
    request.delete(options.elasticSearchUrl + options.indexName, () => {
      done();
    });
  });

  after(done => {
    let {elasticSearchUrl, indexName} = options;
    //delete ES data
    request.delete(elasticSearchUrl + indexName, () => {
      done();
    });
  });

  it('check esClient init', (done) => {
    assert.equal(esClient.indexName, options.indexName);
    assert.equal(esClient.esUrl, options.elasticSearchUrl);
    assert(esClient.indexProperties);
    done();
  });

  it('healthCheck', (done) => {
    esClient.healthCheck().then(body => {
      assert.equal(body.tagline, 'You Know, for Search');
      done();
    }).catch(done);
  });

  it('setMapping', (done) => {
    esClient.setMapping().then(done).catch(done);
  });

  it('getMapping', (done) => {
    esClient.getMapping().then(body => {
      assert.deepEqual(esClient.indexProperties, body);
      done();
    }).catch(done);
  });

  it('getMapping when index not found(should execute setMapping)', (done) => {
    //delete ES data
    request.delete(options.elasticSearchUrl + options.indexName, () => {
      esClient.getMapping().then(body => {
        assert.deepEqual(esClient.indexProperties, body);
        done();
      }).catch(done);
    });
  });

  it('insertDocument', (done) => {
    let document = {
      url: '/host',
      method: 'GET',
      user: 'sankou7',
      ip: '127.0.0.1',
      statusCode: 200,
      processingTime: 10,
      createdAt: Date.now(),
      userAgent: 'scraper'
    };
    esClient.insertDocument(document).then(doc => {
      assert.notDeepStrictEqual(doc, document);
      done();
    }).catch(done);
  });

});

describe('esClient Bad esUrl Tests', () => {
  const options = {
    elasticSearchUrl: 'http://127.0.0.1:9201/',
    indexName: 'test-tracking'
  };
  const esClient = new ElasticSearchClient(options);

  it('healthCheck should throw an error', (done) => {
    esClient.healthCheck().then(body => {
      done(body);
    }).catch(err => {
      assert(err.code, 'ECONNREFUSED');
      done();
    });
  });

  it('setMapping should throw an error', (done) => {
    esClient.setMapping().then(done).catch(err => {
      assert(err.message.toString().includes('Track-Requests: error while mappings'));
      done();
    });
  });

  it('getMapping should throw an error', (done) => {
    esClient.getMapping().then(done).catch(err => {
      assert(err.message.toString().includes('Track-Requests: error while fetching'));
      done();
    });
  });

  it('insertDocument should return an error', (done) => {
    esClient.insertDocument({url: 'test'}).then(err => {
      assert.equal(err.error, true);
      done();
    });
  });

});

describe('esClient custom index properties', () => {
  const options = {
    elasticSearchUrl: 'http://127.0.0.1:9200/',
    indexName: 'test-tracking',
    indexProperties: {
      url: {'type': 'keyword'},
      method: {'type': 'keyword'},
      user: {'type': 'keyword'},
      params: {'type': 'nested'}
    }
  };
  before(done => {
    //delete ES data
    request.delete(options.elasticSearchUrl + options.indexName, () => {
      done();
    });
  });

  after(done => {
    let {elasticSearchUrl, indexName} = options;
    //delete ES data
    request.delete(elasticSearchUrl + indexName, () => {
      done();
    });
  });

  const esClient = new ElasticSearchClient(options);

  it('check esClient indexProperties', (done) => {
    assert.deepEqual(esClient.indexProperties, options.indexProperties);
    done();
  });

  it('healthCheck', (done) => {
    esClient.healthCheck().then(body => {
      assert.equal(body.tagline, 'You Know, for Search');
      done();
    }).catch(done);
  });

  it('setMapping', (done) => {
    esClient.setMapping().then(done).catch(done);
  });

  it('insertDocument', (done) => {
    let document = {
      url: '/host',
      method: 'GET',
      user: 'sankou7',
      ip: '127.0.0.1',
      statusCode: 200,
      processingTime: 10,
      createdAt: Date.now(),
      userAgent: 'scraper',
      params: {data: 'test'}
    };
    let expectedDoc = {};
    Object.keys(options.indexProperties).forEach(key => {
      expectedDoc[key] = document[key];
    });
    esClient.insertDocument(document).then(doc => {
      assert.deepEqual(expectedDoc, doc);
      done();
    }).catch(done);
  });

});