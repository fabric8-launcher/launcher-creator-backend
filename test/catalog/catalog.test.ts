
import * as test from 'tape';
import * as catalog from 'core/catalog';

test('catalog list capabilities', (t) => {
    t.plan(1);

    catalog.listCapabilityInfos().then(caps => t.ok(caps.length > 0));
});

test('catalog get capability', (t) => {
    t.plan(1);

    t.is(catalog.info(catalog.getCapabilityModule('database')).type, 'capability');
});

test('catalog list generators', (t) => {
    t.plan(1);

    catalog.listGeneratorInfos().then(caps => t.ok(caps.length > 0));
});

test('catalog get generator', (t) => {
    t.plan(1);

    t.is(catalog.info(catalog.getGeneratorModule('platform-vertx')).type, 'generator');
});
