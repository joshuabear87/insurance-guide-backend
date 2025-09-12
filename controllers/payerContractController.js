// controllers/payerContractController.js
import mongoose from 'mongoose';
import PayerContract, {
  FINANCIAL_CLASSES,
  CONTRACT_STATUSES,
} from '../models/payerContractModel.js';

/* ----------------------------- helpers ---------------------------------- */

const norm = (s) => String(s || '').trim().toLowerCase();

function cleanPhones(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return list
    .map((p) => ({
      label: (p.label || 'General').trim(),
      number: (p.number || '').trim(),
      notes: (p.notes || '').trim(),
    }))
    .filter((p) => p.number); // require a number
}

function cleanPortals(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return list
    .map((p) => ({
      label: (p.label || '').trim(),
      url: (p.url || '').trim(),
      notes: (p.notes || '').trim(),
    }))
    .filter((p) => p.label && p.url); // require label + url
}

/* ------------------------------- list ------------------------------------ */
// GET /hub/payer-contracts
// Optional query params: q, payerName, facilityName, financialClass, status, page, limit
export async function listPayerContracts(req, res) {
  const {
    q = '',
    payerName = '',
    facilityName = '',
    financialClass = '',
    status = '',
    page = 1,
    limit = 200,
  } = req.query;

  const and = [];
  const filter = {};

  if (q) {
    const qn = norm(q);
    and.push({
      $or: [
        { payerName_lc: { $regex: qn, $options: 'i' } },
        { facilityName_lc: { $regex: qn, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
        // optional: search inside phones/portals
        { 'phones.number': { $regex: q, $options: 'i' } },
        { 'phones.label': { $regex: q, $options: 'i' } },
        { 'portals.label': { $regex: q, $options: 'i' } },
        { 'portals.url': { $regex: q, $options: 'i' } },
      ],
    });
  }
  if (payerName) and.push({ payerName_lc: { $regex: `^${norm(payerName)}` } });
  if (facilityName) and.push({ facilityName_lc: { $regex: `^${norm(facilityName)}` } });
  if (financialClass) and.push({ financialClass });
  if (status) and.push({ status });
  if (and.length) filter.$and = and;

  const lim = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

  const [items, total] = await Promise.all([
    PayerContract.find(filter)
      .sort({ payerName_lc: 1, facilityName_lc: 1, financialClass: 1 })
      .skip(skip)
      .limit(lim),
    PayerContract.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: lim });
}

/* -------------------------------- get ------------------------------------ */
// GET /hub/payer-contracts/:id
export async function getPayerContract(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const doc = await PayerContract.findById(id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

/* ------------------------------ create ----------------------------------- */
// POST /hub/payer-contracts
// Body: { payerName, facilityName, financialClass, status, notes, effectiveStart, effectiveEnd, phones[], portals[] }
export async function createPayerContract(req, res) {
  try {
    const {
      payerName,
      facilityName,
      financialClass,
      status,
      notes = '',
      effectiveStart = null,
      effectiveEnd = null,
      phones = [],
      portals = [],
    } = req.body || {};

    if (!payerName?.trim() || !facilityName?.trim() || !financialClass || !status) {
      return res
        .status(400)
        .json({ message: 'payerName, facilityName, financialClass and status are required' });
    }
    if (!FINANCIAL_CLASSES.includes(financialClass)) {
      return res
        .status(400)
        .json({ message: `Invalid financialClass. Allowed: ${FINANCIAL_CLASSES.join(', ')}` });
    }
    if (!CONTRACT_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ message: `Invalid status. Allowed: ${CONTRACT_STATUSES.join(', ')}` });
    }

    const doc = await PayerContract.create({
      payerName,
      facilityName,
      financialClass,
      status,
      notes,
      effectiveStart: effectiveStart || null,
      effectiveEnd: effectiveEnd || null,
      phones: cleanPhones(phones),
      portals: cleanPortals(portals),
    });

    return res.status(201).json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      // unique index collision on (payerName_lc, facilityName_lc, financialClass)
      return res.status(409).json({
        message:
          'A contract for this payer, facility and financial class already exists',
        keyValue: err.keyValue,
      });
    }
    return res.status(400).json({ message: err.message || 'Create failed' });
  }
}

/* ------------------------------ update ----------------------------------- */
// PATCH /hub/payer-contracts/:id
export async function updatePayerContract(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const allowed = [
      'payerName',
      'facilityName',
      'financialClass',
      'status',
      'notes',
      'effectiveStart',
      'effectiveEnd',
      'phones',
      'portals',
    ];
    const patch = {};
    for (const k of allowed) {
      if (k in req.body) patch[k] = req.body[k];
    }

    if (patch.financialClass && !FINANCIAL_CLASSES.includes(patch.financialClass)) {
      return res
        .status(400)
        .json({ message: `Invalid financialClass. Allowed: ${FINANCIAL_CLASSES.join(', ')}` });
    }
    if (patch.status && !CONTRACT_STATUSES.includes(patch.status)) {
      return res
        .status(400)
        .json({ message: `Invalid status. Allowed: ${CONTRACT_STATUSES.join(', ')}` });
    }
    if ('phones' in patch) patch.phones = cleanPhones(patch.phones);
    if ('portals' in patch) patch.portals = cleanPortals(patch.portals);

    const doc = await PayerContract.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    Object.assign(doc, patch);
    await doc.save(); // triggers schema pre-validate (normalizes, checks date order, enforces unique index)

    return res.json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message:
          'Updating would create a duplicate payer/facility/financialClass contract',
        keyValue: err.keyValue,
      });
    }
    return res.status(400).json({ message: err.message || 'Update failed' });
  }
}

/* ------------------------------ delete ----------------------------------- */
// DELETE /hub/payer-contracts/:id
export async function deletePayerContract(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const doc = await PayerContract.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}
