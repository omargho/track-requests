'use strict';

const request = require('request');

const requestPromise = (options) => {
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) return reject(err);
      if (res.statusCode >= 400) return reject({body, status: res.statusCode, headers: res.headers});
      return resolve({body, status: res.statusCode, headers: res.headers});
    });
  });
};

class ElasticSearchClient {
  constructor(opts = {}) {
    this.elasticUrl = opts.elasticSearchUrl || 'http://127.0.0.1:9200/';
    this.indexName = opts.indexName || 'tracking';
    this.indexProperties = opts.indexProperties || {
      url: {'type': 'keyword'},
      method: {'type': 'keyword'},
      user: {'type': 'keyword'},
      ip: {'type': 'ip'},
      statusCode: {'type': 'short'},
      processingTime: {'type': 'integer'},
      createdAt: {'type': 'date'},
      error: {'type': 'text'},
      userAgent: {'type': 'text'},
      body: {'type': 'nested'}
    };
  }

  async getMapping() {
    try {
      let {body: mapping} = await requestPromise({method: 'GET', url: this.elasticUrl + this.indexName + '/_mapping', json: true});
      return mapping[this.indexName].mappings.properties;
    } catch (e) {
      if (e.status === 404) {
        await this.setMapping();
        return await this.getMapping();
      }
      console.error('Track-Requests: error while fetching mapping:', e.body || e);
    }
  }

  async healthCheck() {
    let {body} = await requestPromise({method: 'GET', url: this.elasticUrl, json: true});
    return body;
  }

  async setMapping() {
    try {
      await requestPromise({
        method: 'PUT',
        url: this.elasticUrl + this.indexName,
        body: {
          mappings: {
            properties: this.indexProperties
          }
        },
        json: true
      });
    } catch (e) {
      console.error('Track-Requests: error while mappings initializing :', e.body || e);
    }
  }

  async insertDocument(document) {
    try {
      let cleanedDoc = {};
      Object.keys(this.indexProperties).forEach(key => {
        cleanedDoc[key] = document[key] || null;
      });
      await requestPromise({
        method: 'POST',
        url: this.elasticUrl + this.indexName + '/_doc',
        body: cleanedDoc,
        json: true
      });
    } catch (e) {
      console.error('Track-Requests: error while inserting a document :', e.body || e);
    }
  }
}

module.exports = ElasticSearchClient;