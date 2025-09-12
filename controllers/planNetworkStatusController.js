// controllers/planNetworkStatusController.js
import mongoose from 'mongoose';
import PlanNetworkStatus from '../models/planNetworkStatusModel.js';

// GET /hub/plan-network-statuses?q=...
export async function listStatuses(req, res) {
  const { q = '' } = req.query;
  const filter = q
    ? { $or: [{ key: { $regex: q, $options: 'i' } }, { label: { $regex: q, $options: 'i' } }, { notes: { $regex: q, $options: 'i' } }] }
    : {};
  const items = await PlanNetworkStatus.find(filter).sort({ label: 1 });
  res.json(items);
}

// POST /hub/plan-network-statuses
export async function createStatus(req, res) {
  try {
    const { key, label, notes = '', color = '' } = req.body || {};
    if (!key?.trim() || !label?.trim()) {
      return res.status(400).json({ message: 'key and label are required' });
    }
    const doc = await PlanNetworkStatus.create({ key: key.trim().toLowerCase(), label: label.trim(), notes, color });
    res.status(201).json(doc);
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'key already exists' });
    res.status(400).json({ message: e.message || 'Create failed' });
  }
}

// PATCH /hub/plan-network-statuses/:id
export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const doc = await PlanNetworkStatus.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const patch = {};
    ['key', 'label', 'notes', 'color'].forEach(k => {
      if (k in req.body) patch[k] = req.body[k];
    });
    if ('key' in patch) patch.key = String(patch.key || '').trim().toLowerCase();

    Object.assign(doc, patch);
    await doc.save();
    res.json(doc);
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: 'key already exists' });
    res.status(400).json({ message: e.message || 'Update failed' });
  }
}

// DELETE /hub/plan-network-statuses/:id
export async function deleteStatus(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const doc = await PlanNetworkStatus.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}
