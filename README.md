# Track-Requests

HTTP request tracker middleware for node.js

A middleware that tracks http requests and save them 
into [ElasticSearch](https://www.elastic.co/fr/products/elastic-stack) in order to use [Kibana](https://www.elastic.co/fr/products/kibana) as a
Dashboard to give you the needed analytics of your application (sign up numbers,
number of active users, errors tracking...)  
  
  
## API

<!-- eslint-disable no-unused-vars -->

```js
const express = require('express');
const app = express();
const trackRequests = require('..');
const trackRequestsOptions = {
  elasticSearchOptions: {
    elasticSearchUrl: 'http://127.0.0.1:9200/'
  }
};
app.use(trackRequests(trackRequestsOptions));;
```
