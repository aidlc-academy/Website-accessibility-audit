import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createAuditStorage } from '../server/storage.js';

function makeAudit(id, scannedAt, issues = []) {
  return {
    id,
    url: `https://${id}.example`,
    pageTitle: id,
    scannedAt,
    status: 'completed',
    standard: 'WCAG 2.2 Level AA',
    viewport: '1280x900',
    axeVersion: '4.14.0',
    scanConfiguration: { scanner: 'axe-core', timeoutMs: 60000 },
    issues,
  };
}

test('imports legacy audits once and persists full records across database reopen', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'accesslens-storage-'));
  const databasePath = path.join(directory, 'audits.sqlite');
  const legacyJsonPath = path.join(directory, 'audits.json');
  const legacyAudits = [
    makeAudit('newer', '2026-10-13T10:00:00.000Z', [
      { id: 'finding-1', ruleId: 'image-alt', severity: 'Serious', selector: '#logo' },
    ]),
    makeAudit('older', '2026-10-12T10:00:00.000Z'),
  ];
  fs.writeFileSync(legacyJsonPath, JSON.stringify(legacyAudits), 'utf8');

  try {
    const firstConnection = createAuditStorage({ databasePath, legacyJsonPath });
    assert.deepEqual(firstConnection.listAudits(), legacyAudits);
    assert.deepEqual(firstConnection.findAudit('newer'), legacyAudits[0]);
    assert.equal(firstConnection.findAudit('missing'), null);

    const database = new DatabaseSync(databasePath);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM audits').get().count, 2);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM audit_issues').get().count, 1);
    assert.equal(
      database.prepare("SELECT value FROM storage_metadata WHERE key = 'legacy_json_import'").get().value,
      'imported:2',
    );
    database.close();

    const addedAudit = makeAudit('latest', '2026-10-13T11:00:00.000Z', [
      { id: 'finding-2', ruleId: 'button-name', severity: 'Moderate', selector: '#save' },
    ]);
    firstConnection.saveAudit(addedAudit);
    const databaseAfterSave = new DatabaseSync(databasePath);
    assert.equal(databaseAfterSave.prepare('SELECT COUNT(*) AS count FROM audit_issues').get().count, 2);
    databaseAfterSave.close();
    firstConnection.close();

    fs.writeFileSync(legacyJsonPath, JSON.stringify([...legacyAudits, makeAudit('late-json', '2026-10-14T00:00:00Z')]), 'utf8');
    const reopenedConnection = createAuditStorage({ databasePath, legacyJsonPath });
    assert.deepEqual(reopenedConnection.listAudits(), [addedAudit, ...legacyAudits]);
    assert.deepEqual(reopenedConnection.findAudit('latest'), addedAudit);
    assert.equal(reopenedConnection.findAudit('late-json'), null);
    reopenedConnection.close();
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('refuses malformed legacy data without marking the import complete', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'accesslens-storage-invalid-'));
  const databasePath = path.join(directory, 'audits.sqlite');
  const legacyJsonPath = path.join(directory, 'audits.json');
  fs.writeFileSync(legacyJsonPath, JSON.stringify([makeAudit('', '2026-10-13T10:00:00.000Z')]), 'utf8');

  try {
    assert.throws(
      () => createAuditStorage({ databasePath, legacyJsonPath }),
      /non-empty string ID/,
    );
    const database = new DatabaseSync(databasePath);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM audits').get().count, 0);
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM storage_metadata WHERE key = 'legacy_json_import'").get().count,
      0,
    );
    database.close();
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
