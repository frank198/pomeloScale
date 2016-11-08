/**
 * Created by frank on 16-11-8.
 */
const Utils = require('../../lib/util/utils');

describe("test Utils",() =>
{
    it("LocalIps", done =>
    {
        const localIps = Utils.LocalIps;
        console.info(localIps);
        done();
    });

    it("IsLocal",done =>
    {
        const localIps = Utils.IsLocal('192.168.31.193');
        console.info(localIps);
        done();
    })
});