'use strict';

const serverFactory = new (require('./utils/serverFactory'))();
const trackerRequests = require('..');
const request = require('request');
const assert = require('assert');

describe('Basic tests', () => {
  const options = {
    elasticSearchOptions: {
      elasticSearchUrl: 'http://127.0.0.1:9200/',
      indexName: 'test-tracking'
    }
  };

  before(done => {
    let {elasticSearchUrl, indexName} = options.elasticSearchOptions;
    //delete ES data
    request.delete(elasticSearchUrl + indexName, () => {
      done();
    });
  });

  after(done => {
    let {elasticSearchUrl, indexName} = options.elasticSearchOptions;
    //delete ES data
    request.delete(elasticSearchUrl + indexName, () => {
      setTimeout(done, 300);
    });
  });

  serverFactory.createSever(3000, [trackerRequests(options)],
    [
      {method: 'get', endpoint: '/', controller: (req, res) => res.send('Hakuna Matata')}
    ]);

  it('check if server started correctly', (done) => {
    request.get('http://127.0.0.1:3000/', (err, response, body) => {
      assert.equal(response.statusCode, 200);
      assert.equal(body, 'Hakuna Matata');
      done();
    });
  });

});