# HaTest

Something like superagent make HTTP assertions easy.

![hatest](https://ww1.sinaimg.cn/thumbnail/69402bf8gy1fimpgfmv6wj20qi0q8q4h.jpg)

## Getting Started

Install SuperTest as an npm module and save it to your package.json file as a development dependency:

```
npm install hatest --save-dev
```

Once installed it can now be referenced by simply calling require('hatest');

## Example

You may pass an http.Server, or a Function to request() - if the server is not already listening for connections then it is bound to an ephemeral port for you so there is no need to keep track of ports.

SuperTest works with any test framework, here is an example without using any test framework at all:

```javascript
const hatest = require('hatest');
const express = require('express');
 
const app = express();
 
app.get('/user', function(req, res) {
  res.status(200).json({ name: 'tobi' });
});
 
hatest(app)
  .get('/user')
  .expect('Content-Type', /json/)
  .expect('Content-Length', '15')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
  });

```

## Notes

Inspired by [supertest](https://github.com/visionmedia/supertest).

