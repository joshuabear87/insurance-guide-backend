// controllers/planPolicyController.js
import mongoose from 'mongoose';
import PlanPolicy, { NETWORK_STATUSES } from '../models/planPolicyModel.js';

const norm = (s) => String(s || '').trim().toLowerCase();

function cleanPhones(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a.map(p => ({
      label: (p.label || 'General').trim(),
      number: (p.number || '').trim(),
      notes: (p.notes || '').trim(),
    }))
    .filter(p => p.number);
}
function cleanPortals(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a.map(p => ({
      label: (p.label || '').trim(),
      url: (p.url || '').trim(),
      notes: (p.notes || '').trim(),
    }))
    .filter(p => p.label && p.url);
}
function cleanAddresses(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a.map(x => ({
      label: (x.label || 'Mailing').trim(),
      line1: (x.line1 || '').trim(),
      line2: (x.line2 || '').trim(),
      city:  (x.city  || '').trim(),
      state: (x.state || '').trim(),
      zip:   (x.zip   || '').trim(),
      notes: (x.notes || '').trim(),
    }))
    .filter(x => x.line1 && x.city && x.state && x.zip);
}
function cleanSLPs(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a.map(s => ({
      locationName: (s.locationName || '').trim(),
      decision: s.decision === 'Accept' ? 'Accept' : 'Refer',
      notes: (s.notes || '').trim(),
    }))
    .filter(s => s.locationName);
}

/* LIST: GET /hub/plan-policies */
export async function listPlanPolicies(req, res) {
  const {
    q = '', planName = '', facilityName = '', networkStatus = '',
    page = 1, limit = 200,
  } = req.query;

  const and = [];
  if (q) {
    const qn = norm(q);
    and.push({
      $or: [
        { planName_lc: { $regex: qn, $options: 'i' } },
        { facilityName_lc: { $regex: qn, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
        { 'phones.number':  { $regex: q, $options: 'i' } },
        { 'phones.label':   { $regex: q, $options: 'i' } },
        { 'portals.label':  { $regex: q, $options: 'i' } },
        { 'portals.url':    { $regex: q, $options: 'i' } },
        { 'addresses.line1':{ $regex: q, $options: 'i' } },
        { 'addresses.city': { $regex: q, $options: 'i' } },
        { 'serviceLocationPolicies.locationName': { $regex: q, $options: 'i' } },
      ],
    });
  }
  if (planName)     and.push({ planName_lc: { $regex: `^${norm(planName)}` } });
  if (facilityName) and.push({ facilityName_lc: { $regex: `^${norm(facilityName)}` } });
  if (networkStatus) and.push({ networkStatus });

  const filter = and.length ? { $and: and } : {};

  const lim = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

  const [items, total] = await Promise.all([
    PlanPolicy.find(filter).sort({ planName_lc: 1, facilityName_lc: 1 }).skip(skip).limit(lim),
    PlanPolicy.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: lim });
}

/* GET: /hub/plan-policies/:id */
export async function getPlanPolicy(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const doc = await PlanPolicy.findById(id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

/* CREATE: POST /hub/plan-policies */
export async function createPlanPolicy(req, res) {
  try {
    const {
      planName, facilityName, networkStatus,
      notes = '', phones = [], portals = [], addresses = [], serviceLocationPolicies = [],
    } = req.body || {};

    if (!planName?.trim() || !facilityName?.trim() || !networkStatus) {
      return res.status(400).json({ message: 'planName, facilityName, and networkStatus are required' });
    }
    if (!NETWORK_STATUSES.includes(networkStatus)) {
      return res.status(400).json({ message: `Invalid networkStatus. Allowed: ${NETWORK_STATUSES.join(', ')}` });
    }

    const doc = await PlanPolicy.create({
      planName,
      facilityName,
      networkStatus,
      notes,
      phones: cleanPhones(phones),
      portals: cleanPortals(portals),
      addresses: cleanAddresses(addresses),
      serviceLocationPolicies: cleanSLPs(serviceLocationPolicies),
    });

    res.status(201).json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: 'A plan policy for this plan + facility already exists' });
    }
    res.status(400).json({ message: e.message || 'Create failed' });
  }
}

/* UPDATE: PATCH /hub/plan-policies/:id */
export async function updatePlanPolicy(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const allowed = [
      'planName', 'facilityName', 'networkStatus', 'notes',
      'phones', 'portals', 'addresses', 'serviceLocationPolicies',
    ];
    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

    if ('networkStatus' in patch && !NETWORK_STATUSES.includes(patch.networkStatus)) {
      return res.status(400).json({ message: `Invalid networkStatus. Allowed: ${NETWORK_STATUSES.join(', ')}` });
    }
    if ('phones'   in patch) patch.phones   = cleanPhones(patch.phones);
    if ('portals'  in patch) patch.portals  = cleanPortals(patch.portals);
    if ('addresses'in patch) patch.addresses= cleanAddresses(patch.addresses);
    if ('serviceLocationPolicies' in patch) patch.serviceLocationPolicies = cleanSLPs(patch.serviceLocationPolicies);

    const doc = await PlanPolicy.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    Object.assign(doc, patch);
    await doc.save();

    res.json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: 'Updating would duplicate plan + facility' });
    }
    res.status(400).json({ message: e.message || 'Update failed' });
  }
}

/* DELETE: /hub/plan-policies/:id */
export async function deletePlanPolicy(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const doc = await PlanPolicy.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}
