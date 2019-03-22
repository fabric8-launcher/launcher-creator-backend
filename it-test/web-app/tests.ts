import 'mocha';
import * as assert from 'assert';
import { Context } from '../functions';
import * as request from 'request';
import { promisify } from 'util';
import * as HttpStatus from 'http-status-codes';

export function test(ctx: Context) {
    const get = promisify(request.get);

    it('HealthCheck', function () {
        const url = `http://${ctx.routeHost}/`;
        return get(url).then(res => assert.strictEqual(res.statusCode, HttpStatus.OK));
    });
}
