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
    this.logger = opts.logger || (() => {});
    this.esUrl = opts.elasticSearchUrl || 'http://127.0.0.1:9200/';
    this.indexName = opts.indexName || 'tracking';
    this._esVersion = '7.5.0';
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
      let {body: mapping} = await requestPromise({method: 'GET', url: this.esUrl + this.indexName + '/_mapping', json: true});
      let mappings = mapping[this.indexName].mappings;
      return this._esVersion < '6.0.0' ? mappings.default.properties : mappings.properties;
    } catch (e) {
      if (e.status === 404 && e.body.error && e.body.error.type == 'index_not_found_exception') {
        await this.setMapping();
        return await this.getMapping();
      }
      throw Error('Track-Requests: error while fetching mapping:' + (e.body && JSON.stringify(e.body) || e));
    }
  }

  async healthCheck() {
    let {body} = await requestPromise({method: 'GET', url: this.esUrl, json: true});
    this._esVersion = body.version.number;
    return body;
  }

  async setMapping() {
    try {
      await requestPromise({
        method: 'PUT',
        url: this.esUrl + this.indexName,
        body: {
          mappings: this._esVersion < '6.0.0'
            ? {default: {properties: this.indexProperties}}
            : {properties: this.indexProperties}
        },
        json: true
      });
    } catch (e) {
      throw Error('Track-Requests: error while mappings initializing :' + (e.body && JSON.stringify(e.body) || e));
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
        url: this.esUrl + this.indexName + (this._esVersion < '6.0.0' ? '/default' : '/_doc'),
        body: cleanedDoc,
        json: true
      });

      return cleanedDoc;
    } catch (e) {
      this.logger('Track-Requests: error while inserting a document :' + (e.body && JSON.stringify(e.body) || e));
      return {error: true, message: 'Track-Requests: error while inserting a document :' + (e.body && JSON.stringify(e.body) || e)};
    }
  }
}

module.exports = ElasticSearchClient;