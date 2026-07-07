const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class LocalStorageMock {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

const context = {
  console,
  window: {},
  document: { addEventListener() {} },
  navigator: { userAgent: 'node-test' },
  localStorage: new LocalStorageMock(),
  sessionStorage: new LocalStorageMock(),
  setTimeout,
  clearTimeout
};
context.window = context;
context.global = context;

const dbPath = path.join(__dirname, '..', 'assets', 'js', 'db.js');
const source = fs.readFileSync(dbPath, 'utf8');
vm.createContext(context);
vm.runInContext(source, context);

const db = context.window.db;
assert.ok(db, 'db should be initialized');
assert.ok(typeof db.createAmbulanceRequest === 'function', 'createAmbulanceRequest should exist');
assert.ok(typeof db.assignAmbulanceRequest === 'function', 'assignAmbulanceRequest should exist');

const user = { id: 99, role: 'patient', name: 'Test Patient' };
context.sessionStorage.setItem('sh_current_user', JSON.stringify(user));
const result = db.createAmbulanceRequest(99, { priority: 'critical', symptoms: 'Chest pain' });
assert.strictEqual(result.success, true, 'request should be created');
assert.strictEqual(db.getAmbulanceRequests().length, 1, 'request should be persisted');

const assigned = db.assignAmbulanceRequest(result.request.id, 1, 1);
assert.strictEqual(assigned.success, true, 'request should be assignable');

console.log('ambulance db tests passed');
