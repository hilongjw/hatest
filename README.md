![hatest](https://ws3.sinaimg.cn/mw690/006tNc79gy1fimw78nfjnj31jg0c2417.jpg)

# HaTest

A node API testing tool similar to Supertest, based on Axios.

## Getting Started

Install Hatest as an npm module and save it to your package.json file as a development dependency:

```
npm i hatest --save-dev
```

Once installed it can now be referenced by simply calling require('hatest')

## Example

Hatest works with mocha, here is an example:

```javascript
const hatest = require('hatest')
const express = require('express')
 
describe('simple', function() {
    it('test1', function () {
        const app = express()

        app.get('/', function(req, res) {
            res.send('hello')
        })

        return request(app)
            .get('/')
            .expect('hello')
            .end()
    })
})
```

## Notes

Inspired by [supertest](https://github.com/visionmedia/supertest).

