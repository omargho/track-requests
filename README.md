# Track-Requests [![NPM Version][npm-version-image]][npm-url] [![Build Status](https://travis-ci.com/omargho/track-requests.svg?branch=master)](https://travis-ci.com/omargho/track-requests) [![Coverage Status](https://coveralls.io/repos/github/omargho/track-requests/badge.svg?branch=master)](https://coveralls.io/github/omargho/track-requests?branch=master)

HTTP request tracker middleware for node.js

A middleware that tracks http requests and save them 
into [ElasticSearch](https://www.elastic.co/fr/products/elastic-stack) in order to use [Kibana](https://www.elastic.co/fr/products/kibana) as a
Dashboard to give you the needed analytics of your application (sign up numbers,
number of active users, errors tracking...)  
  
  
## Getting Started
Install the module with: `npm install track-requests`
<!-- eslint-disable no-unused-vars -->

```js
const express = require('express');
const app = express();
const trackRequests = require('track-requests');
const options = {
  elasticSearchOptions: {
    elasticSearchUrl: 'http://127.0.0.1:9200/'
  }
};
app.use(trackRequests(options));
```

## Documentation
### `trackRequests(options)`
Create a new track request middleware function using the given `options`.  
`options` is an object container for parameters used to customise the trackRequest middleware
 

### `options.getters`
`Object`- Contains functions used to generate the tracking document

#### `options.getters.getUser`
`Function`- return `String` the http req user's Id. it takes as parameter `req` (The HTTP request) and `res` (The HTTP response)

`default: () => 'anonymous'`
 
Usage example: 
```js
let options = {
  getters: {
    getUser: (req, res) => {
      return req.user.id;
    }
  }
};
```

#### `options.getters.getIp`
`Function`- return `String` the http req user's Ip. it takes as parameter `req` (The HTTP request) and `res` (The HTTP response)

`default: (req) => req.headers['x-real-ip']`

#### `options.getters.getUserAgent`
`Function`- return `String` the http req user's userAgent. it takes as parameter `req` (The HTTP request) and `res` (The HTTP response)

`default: (req) => req.headers['user-agent']`

#### `options.getters.getErrorMessage`
`Function`- return `String` the error message when an error happens on the controller. it takes as parameter `req` (The HTTP request) and `res` (The HTTP response)

`default: (req) => req.error`

#### `options.getters.getBody`
`Function`- return `Object` http request body. it takes as parameter `req` (The HTTP request) and `res` (The HTTP response)

`default: (req) => req.body`

#### `options.getters.getExtraFields`
`Function`- return `Object` extra fields to be added to the generated tracking document. it takes as parameter `req` (The HTTP request) and `res` (The HTTP response)  
`PS: make sure to add a custom options.elasticSearchOptions.indexProperties that contains the extra fields parmeters`

Usage example: 
```js
let options = {
  elasticSearchOptions: {
    indexProperties: {
      url: {'type': 'keyword'},
      method: {'type': 'keyword'},
      user: {'type': 'keyword'},
      ip: {'type': 'ip'},
      statusCode: {'type': 'short'},
      processingTime: {'type': 'integer'},
      createdAt: {'type': 'date'},
      error: {'type': 'text'},
      userAgent: {'type': 'text'},
      body: {'type': 'nested'},
      myCustomField: {'type': 'text'}
    }
  },
  getters: {
    getExtraFields: (req, res) => {
      return {
        myCustomField:' myCustomFieldValue'
      }
    }
  }
};
```

### `options.routesToIgnore`
`Array`- array of `String`|`Regex`|`Object` of the endpoints that you want the tracker to ignore them

- `String` it should match the exact endpoint's url to ignore it
- `Regex`  it should verify the endpoint's url to ignore it
- `Object` all the parameters should matches to ignore the endpoint
    - url `String` it should match the exact endpoint
    - regex `Regex` it should verify the endpoint
    - statusCode `Number` it should match the HTTP response's Status Code
    - method `String` it should match the HTTP request's method

Usage example: 
```js
let options = {
  routesToIgnore:[
    /user/, //ignore all the endpoint that verify this regex 
    '/organization/member',//ignore this exact endpoint  
    {url: '/healthcheck', method: 'GET'},// ignore the GET requests to this exact endpoint    
    {regex: /search/, method: 'POST', statusCode: 404}// ignore the POST with a 404 response status code that verify this regex  
  ]
};
``` 

### `options.endpointsBodies`
`Array`- array of `Object` of the endpoints for which you want the tracker to change the body and the changes required.
  
- `String`|`Regex`|`Object` endpoint:
    - `String` it should match the exact endpoint's url 
    - `Regex`  it should verify the endpoint's url 
    - `Object` all the parameters should matches 
        - url `String` it should match the exact endpoint
        - regex `Regex` it should verify the endpoint
        - statusCode `Number` it should match the HTTP response's Status Code
        - method `String` it should match the HTTP request's method
- `Object`- body:
    - `Boolean`- it indicates the action to keep or delete properties in the body of the defined endpoint
        - true: keep the defined properties
        - false: delete the defined properties 
    - `Array`- array of `String` defining the properties to keep or delete

Usage example: 
```js
let options = {
  endpointsBodies:[
    {endpoint : /user/, body : {keep: true, properties: ['name']}},//only keep the defined body properties of all the endpoints that verify this regex 
    {endpoint : '/organization/member', body : {keep: true, properties: ['lorem','ipsum']}},//only keep the defined body properties of this exact all the endpoint
    {endpoint : {url: '/healthcheck', method: 'GET'}, body : {keep: false, properties: ['roo','kies']}},// only delete the defined body properties of the GET requests to this exact endpoint    
  ]
};
``` 

### `options.elasticSearchOptions`
`Object`- Contains the parameters used to customise the elasticSearch client

#### `options.elasticSearchOptions.elasticSearchUrl`
`String`- ElasticSearch's Url  `(default: http://127.0.0.1:9200/)`

#### `options.elasticSearchOptions.indexName`
`String`- ElasticSearch's Index Name `(default: tracking)`

#### `options.elasticSearchOptions.indexProperties`
`Object`- ElasticSearch's Index Properties, it represent the schema of the object that will be saved into elasticSearch Document.  
 It's used to:
  - setup the elasticSearch index when it does not already exists   
  - make sure that the generated document that will be inserted into ES have the specified schema (any other parameter of the generated document will be deleted before the insertion)

`default:`   
```json
{
  "url": {"type" : "keyword"},
  "method": {"type" : "keyword"},
  "user": {"type": "keyword"},
  "ip": {"type": "ip"},
  "statusCode": {"type": "short"},
  "processingTime": {"type": "integer"},
  "createdAt": {"type": "date"},
  "error": {"type": "text"},
  "userAgent": {"type": "text"},
  "body": {"type": "nested"}
}  
``` 

[MIT](LICENSE)

[npm-url]: https://www.npmjs.com/package/track-requests
[npm-version-image]: https://badgen.net/npm/v/track-requests
