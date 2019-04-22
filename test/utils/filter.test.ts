
import * as test from 'tape';
import { getFilteredEnums, getFilteredRuntimeIds } from 'core/utils';

test('getFilteredRuntimeIds unfiltered', (t) => {
    t.plan(1);
    const ids = getFilteredRuntimeIds()
    t.same(ids.sort(), ['angular', 'dotnet', 'nodejs', 'quarkus', 'react', 'springboot', 'thorntail', 'vertx', 'vuejs', 'wildfly'])
});

test('getFilteredRuntimeIds normal filter', (t) => {
    t.plan(1);
    const ids = getFilteredRuntimeIds('quarkus , vertx,dummy ')
    t.same(ids.sort(), ['quarkus', 'vertx'])
});

test('getFilteredRuntimeIds negated filter', (t) => {
    t.plan(1);
    const ids = getFilteredRuntimeIds(' !  quarkus , vertx,dummy ')
    t.same(ids.sort(), ['angular', 'dotnet', 'nodejs', 'react', 'springboot', 'thorntail', 'vuejs', 'wildfly'])
});

test('getFilteredEnums unfiltered', (t) => {
    t.plan(1);
    const enums = getFilteredEnums()['runtime.name'];
    t.same(enums.map(e => e.id).sort(), ['angular', 'dotnet', 'nodejs', 'quarkus', 'react', 'springboot', 'thorntail', 'vertx', 'vuejs', 'wildfly'])
});

test('getFilteredEnums normal filter', (t) => {
    t.plan(1);
    const enums = getFilteredEnums('quarkus , vertx,dummy ')['runtime.name'];
    t.same(enums.map(e => e.id).sort(), ['quarkus', 'vertx'])
});

test('getFilteredEnums negated filter', (t) => {
    t.plan(1);
    const enums = getFilteredEnums(' !  quarkus , vertx,dummy ')['runtime.name'];
    t.same(enums.map(e => e.id).sort(), ['angular', 'dotnet', 'nodejs', 'react', 'springboot', 'thorntail', 'vuejs', 'wildfly'])
});
