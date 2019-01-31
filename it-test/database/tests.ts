import 'mocha';
import * as assert from 'assert';
import { Context } from '../functions';
import * as request from 'request';
import { promisify } from 'util';
import * as HttpStatus from 'http-status-codes';

export function test(ctx: Context) {
    const get = promisify(request.get);
    const put = promisify(request.put);
    const post = promisify(request.post);
    const del = promisify(request.delete);

    it('DatabaseGetAll', function() {
        const url = `http://${ctx.routeHost}/api/fruits`;
        return get({url, 'json': true}).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.OK);
            assert(Array.isArray(res.body));
            assert(res.body.length >= 2);
            const item = res.body.find(i => i.id === 1);
            assert.deepStrictEqual(item, { 'id': 1, 'name': 'Apple', 'stock': 10 });
            const item2 = res.body.find(i => i.id === 2);
            assert.deepStrictEqual(item2, { 'id': 2, 'name': 'Orange', 'stock': 10 });
        });
    });

    it('DatabaseGetOneOk', function() {
        const url = `http://${ctx.routeHost}/api/fruits/1`;
        return get({ url, 'json': true }).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.OK);
            const item = res.body;
            assert.deepStrictEqual(item, { 'id': 1, 'name': 'Apple', 'stock': 10 });
        });
    });

    it('DatabaseGetOneUnknown', function () {
        const url = `http://${ctx.routeHost}/api/fruits/42`;
        return get({ url, 'json': true }).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.NOT_FOUND);
        });
    });

    it('DatabaseUpdateOk', function() {
        const url = `http://${ctx.routeHost}/api/fruits/3`;
        return put({ url, 'json': { 'name': 'Cherry', 'stock': 15 } }).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.OK);
            const item = res.body;
            assert.deepStrictEqual(item, { 'id': 3, 'name': 'Cherry', 'stock': 15 });
        });
    });

    it('DatabaseUpdateUnknown', function () {
        const url = `http://${ctx.routeHost}/api/fruits/42`;
        return put({ url, 'json': { 'name': 'Cherry', 'stock': 15 } }).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.NOT_FOUND);
        });
    });

    it('DatabaseUpdateNotJson', function () {
        const url = `http://${ctx.routeHost}/api/fruits/1`;
        return put({ url, 'body': 'dummy'}).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        });
    });

    it('DatabaseUpdateIllegalPayload', function () {
        const url = `http://${ctx.routeHost}/api/fruits/1`;
        return put({ url, 'json': { 'foo': 'Cherry', 'bar': 15 } }).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.UNPROCESSABLE_ENTITY);
        });
    });

    it('DatabaseInsertDeleteOk', function () {
        const url = `http://${ctx.routeHost}/api/fruits`;
        return post({ url, 'json': { 'name': 'Banana', 'stock': 1 } }).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.CREATED);
            const item = res.body;
            assert.strictEqual(item.name, 'Banana');
            assert.strictEqual(item.stock, 1);
            const url2 = `http://${ctx.routeHost}/api/fruits/${item.id}`;
            return del(url2).then(res2 => {
                assert.strictEqual(res2.statusCode, HttpStatus.NO_CONTENT);
            });
        });
    });

    it('DatabaseInsertNotJson', function () {
        const url = `http://${ctx.routeHost}/api/fruits`;
        return post({ url, 'body': 'dummy'}).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        });
    });

    it('DatabaseInsertIllegalPayload', function () {
        const url = `http://${ctx.routeHost}/api/fruits`;
        return post({ url, 'json': { 'foo': 'Banana', 'bar': 1 } }).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.UNPROCESSABLE_ENTITY);
        });
    });

    it('DatabaseDeleteUnknown', function () {
        const url = `http://${ctx.routeHost}/api/fruits/42`;
        return del(url).then(res => {
            assert.strictEqual(res.statusCode, HttpStatus.NOT_FOUND);
        });
    });
}
