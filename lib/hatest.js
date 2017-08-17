const axios = require('axios')
const https = require('https')
const http = require('http')
const util = require('util')
const Schema = require( './schema' )

const request = axios.create()

request.interceptors.response.use((response) => {
    return response
}, function (error) {
    if (error.response) return Promise.resolve(error.response)
    return Promise.reject(error)
})

// {
//     a: Array,
//     b: Object,
//     c: String
//     d: {
//         type: Array,
//         _children: Array
//     },
//     e: {
//         type: Object,
//         _children: {
//             Object: Array
//         }
//     },
//     f: {
//         a: Array,
//         b: Object
//     }
// }
const ReqMethods = ['delete', 'get', 'head', 'options', 'post', 'put', 'patch']

function checkType(data, schema, keyPath, errorList) {
    if (!data instanceof schema) return new Error(`TypeError ${ keyPath.join('.') } would be ${ schema }`)
    if (data instanceof Object) {
        Object.keys(data).map(key => {
            checkType(data[key], schema)
        })
    }
}

class Hatest {
    constructor (app) {
        this._init(app)
        this._asserts = []
        this._options = {
            url: '',
            timeout: 100 * 1000
        }
    }

    _init (app) {
        if (typeof app === 'string') {
            this._serverPath = app
        } else {
            this._app = app
            this._server = http.createServer(app)
            this._serverPath = this._serverAddress(app)
        }
    }

    _serverAddress (app) {
        let addr = this._server.address()
        let protocol

        if (!addr) {
            this._server.listen(0)
            addr = this._server.address()
        }

        protocol = this._server instanceof https.Server ? 'https' : 'http'
        return protocol + '://127.0.0.1:' + addr.port
    }

    query (params = {}) {
        this._options.params = Object.assign({}, this._options.params, params)
        return this
    }

    set (key, val) {
        this._options.headers = this._options.headers || {}
        this._options.headers[key] = val
        return this
    }

    send (data) {
        this._options.data = Object.assign({}, this._options.data, data)
        return this
    }

    timeout (time) {
        this._options.timeout = time
        return this
    }

    expect (a, b, c) {
        // callback
        if (typeof a === 'function') {
            this._asserts.push({
                ctx: a,
                func: this._assertFunction
            })
            return this
        }

        if (typeof b === 'function') this.end(b)
        if (typeof c === 'function') this.end(c)

        if (typeof a === 'number') {
            this._asserts.push({
                ctx: a,
                func: this._assertStatus
            })
            return this
        }

        // header field
        if (typeof b === 'string' || typeof b === 'number' || b instanceof RegExp) {
            this._asserts.push({
                ctx: {
                    name: '' + a,
                    value: b
                },
                func: this._assertHeader
            })
            return this
        }

        if (typeof a === 'object' || typeof a === 'string') {
            this._asserts.push({
                ctx: a,
                func: this._assertBody
            })
            return this
        }

        return this
    }

    _assertBody (body, res) {
        const isregexp = body instanceof RegExp
        let a
        let b

        // parsed
        if (typeof body === 'object' && !isregexp) {
            const schema = new Schema(body)
            const validation = schema.validate(res.data)
 
            if (!validation.valid) return validation.error
        } else if (body !== res.data) {
            // string
            a = util.inspect(body)
            b = util.inspect(res.data)

            // regexp
            if (isregexp) {
                if (!body.test(res.data)) {
                    return error('expected body ' + b + ' to match ' + body, body, res.data)
                }
            } else {
                return error('expected ' + a + ' response body, got ' + b, body, res.data)
            }
        }
    }

    _assertHeader (header, res) {
        const field = header.name.toLowerCase()
        const value = header.value

        if (res.headers[field] === undefined) {
            return new Error(`expected ${field} header field`)
        }

        if ((value instanceof RegExp && value.test(res.headers[field])) ||
            value === res.headers[field]) {
            return
        }

        return new Error(`expected ${field} matching ${value}, got ${res.headers[field]}`)
    }

    _assertStatus(status, res) {
        if (!res) return new Error('expected ' + status + '", got none response: ' + res)
        let a
        let b
        if (res.status !== status) {
            a = http.STATUS_CODES[status]
            b = http.STATUS_CODES[res.status]
            return new Error('expected ' + status + ' "' + a + '", got ' + res.status + ' "' + b + '"')
        }
    }

    _assertFunction(check, res) {
        let err
        try {
            err = check(res)
        } catch (e) {
            err = e
        }
        if (err instanceof Error) return err
    }

    req (options, method = 'get') {
        if (typeof options === 'string') {
            options = {
                url: options,
                method: method
            }
        }

        options.url = this._serverPath + options.url
        options.method = method
        this._options = options
        return this
    }

    assert (res) {
        let err
        let task
        for (let i = 0, len = this._asserts.length; i < len; i++) {
            task = this._asserts[i]
            err = task.func(task.ctx, res)
            if (err) break
        }
        if (err && err instanceof Error) {
            return err
        }
    }

    end (a) {
        return request(this._options)
            .then(res => {
                if (typeof a === 'object') this.expect(a)
                let err = this.assert(res)
                if (typeof a === 'function') {
                    try {
                        a(err, res)
                    } catch (e) {
                        err = e
                    }
                }
                if (err) return Promise.reject(err)
                return Promise.resolve(res)
            }, err => {
                if (typeof a === 'function') a(err)
                if (err) return Promise.reject(err)
                return Promise.resolve()
            })
    }
}

ReqMethods.map(method => {
    Hatest.prototype[method] = function (options) {
        if (typeof options === 'string') {
            options = {
                url: options,
                method: method
            }
        }

        options.url = this._serverPath + options.url
        options.method = method
        this._options = options
        return this
    }
})

Hatest.prototype.del = Hatest.prototype.delete

/**
 * Return an `Error` with `msg` and results properties.
 *
 * @param {String} msg
 * @param {Mixed} expected
 * @param {Mixed} actual
 * @return {Error}
 * @api private
 */
function error (msg, expected, actual) {
    const err = new Error(msg)
    err.expected = expected
    err.actual = actual
    err.showDiff = true
    return err
}

// hatest(app)
// .get({
//     url: '/preview',
//     params: {
//         aa: 1
//     }
// })
// .expect(200) // number
// .expect('Content-Type', /text\/html/) // string
// .end({  // object
//     data: Object,
//     array: Array,
//     str: String
// })

module.exports = function HatestGen(app) {
    return new Hatest(app)
}