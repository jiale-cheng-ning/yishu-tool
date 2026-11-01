const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  .split('<script>')[1].split('</script>')[0];
const nodes = new Map();
const alerts = [];
const document = {
  getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '', style: {}, addEventListener() {} });
    return nodes.get(id);
  },
  querySelectorAll() { return []; },
  addEventListener() {},
};
const context = vm.createContext({ document, Date, alert: text => alerts.push(text) });
vm.runInContext(source, context);
vm.runInContext('renderResult = (result) => { globalThis.result = result; };', context);

for (const invalid of ['', '-1', '1.5', '1000', 'Infinity', 'NaN', '1e2', '12abc']) {
  assert.throws(() => context.parseCastNumber(invalid));
}
for (const value of ['0', '1', '999']) {
  assert.equal(context.parseCastNumber(value), Number(value));
}
assert.equal(context.parseCastNumber('', true), null);
for (const id of ['num1', 'num2', 'num3']) nodes.get(id).value = '0';
context.handleCast();
assert.equal(alerts.length, 0);
assert.equal(context.result.dongYao, 6);
for (const invalid of ['1.5', '1000', '-1', '1e2']) {
  nodes.get('num1').value = invalid;
  context.handleCast();
}
assert.equal(alerts.length, 4);
let combinations = 0;
for (let upper = 1; upper <= 8; upper++) {
  for (let lower = 1; lower <= 8; lower++) {
    for (let moving = 1; moving <= 6; moving++) {
      const result = context.castHexagram(upper, lower, moving);
      assert.ok(result.benGua.name && result.bianGua.name && result.huGua.name);
      combinations++;
    }
  }
}
console.log(`输入边界与 ${combinations} 种卦象组合：通过`);
