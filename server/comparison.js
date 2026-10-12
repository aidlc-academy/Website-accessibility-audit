function normalizedUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

function sameConfiguration(left, right) {
  if (!left || !right) return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

function findingKey(issue) {
  if (!issue.ruleId || !issue.elementId) return null;
  return `${issue.ruleId}\u0000${issue.elementId}`;
}

export function compareAudits(baseline, current) {
  const base = {
    baselineAuditId: baseline?.id || '',
    baselineScannedAt: baseline?.scannedAt || '',
    resolved: [],
    remaining: [],
    newlyDetected: [],
  };

  if (!baseline) {
    return { ...base, compatible: false, reason: 'The saved comparison audit is no longer available.' };
  }
  if (normalizedUrl(baseline.url) !== normalizedUrl(current.url)) {
    return { ...base, compatible: false, reason: 'Audits of different page URLs cannot be compared.' };
  }
  if (!sameConfiguration(baseline.scanConfiguration, current.scanConfiguration)) {
    return { ...base, compatible: false, reason: 'The saved scans use different or unavailable scan configurations.' };
  }

  const previousByKey = new Map();
  const currentByKey = new Map();
  for (const issue of baseline.issues || []) {
    const key = findingKey(issue);
    if (!key) return { ...base, compatible: false, reason: 'A baseline finding is missing its rule or affected-element identifier.' };
    const group = previousByKey.get(key) || [];
    group.push(issue);
    previousByKey.set(key, group);
  }
  for (const issue of current.issues || []) {
    const key = findingKey(issue);
    if (!key) return { ...base, compatible: false, reason: 'A current finding is missing its rule or affected-element identifier.' };
    const group = currentByKey.get(key) || [];
    group.push(issue);
    currentByKey.set(key, group);
  }

  for (const [key, previousFindings] of previousByKey) {
    const currentFindings = currentByKey.get(key) || [];
    const matchedCount = Math.min(previousFindings.length, currentFindings.length);
    base.remaining.push(...currentFindings.slice(0, matchedCount));
    base.resolved.push(...previousFindings.slice(matchedCount));
  }
  for (const [key, currentFindings] of currentByKey) {
    const previousCount = previousByKey.get(key)?.length || 0;
    base.newlyDetected.push(...currentFindings.slice(previousCount));
  }

  return { ...base, compatible: true, reason: '' };
}
