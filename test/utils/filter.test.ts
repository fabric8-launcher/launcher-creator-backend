
import * as test from 'tape';
import { filterEnums } from 'core/utils';
import { listEnums } from 'core/catalog';

test('getFilteredEnums unfiltered', (t) => {
    t.plan(1);
    const enums = filterEnums(listEnums())['runtime.name'];
    t.same(enums.map(e => e.id).sort(), ['angular', 'dotnet', 'nodejs', 'quarkus', 'react', 'springboot', 'thorntail', 'vertx', 'vuejs', 'wildfly'])
});

test('getFilteredEnums normal runtime filter', (t) => {
    t.plan(1);
    const enums = filterEnums(listEnums(), 'quarkus|vertx|dummy', '')['runtime.name'];
    t.same(enums.map(e => e.id).sort(), ['quarkus', 'vertx'])
});

test('getFilteredEnums negated runtime filter', (t) => {
    t.plan(1);
    const enums = filterEnums(listEnums(), ' !quarkus|vertx|dummy', '')['runtime.name'];
    t.same(enums.map(e => e.id).sort(), ['angular', 'dotnet', 'nodejs', 'react', 'springboot', 'thorntail', 'vuejs', 'wildfly'])
});

test('getFilteredEnums normal version filter', (t) => {
    t.plan(1);
    const enums = filterEnums(listEnums(), '', 'community');
    t.same(enums['runtime.version.vertx'].map(e => e.id).sort(), ['community'])
});

test('getFilteredEnums negated verion filter', (t) => {
    t.plan(1);
    const enums = filterEnums(listEnums(), '', '!community')
    t.same(enums['runtime.version.vertx'].map(e => e.id).sort(), ['redhat'])
});
