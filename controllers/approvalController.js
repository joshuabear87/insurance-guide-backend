import User from '../models/userModel.js';

export const approveUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { approvedFacilities } = req.body;
    if (!Array.isArray(approvedFacilities) || approvedFacilities.length === 0) {
      return res.status(400).json({ message: 'Please select at least one facility to approve.' });
    }

    user.isApproved = true;
    user.status = 'approved';
    user.facilityAccess = [...new Set(approvedFacilities.map(f => f.trim()))];

    await user.save();
    res.json({ message: 'User approved and facility access granted.' });
  } catch (err) {
    console.error('❌ approveUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveFacilityAccess = async (req, res) => {
  const { userId, facility } = req.body;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    if (!facility || typeof facility !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing facility' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const normalizedFacility = facility.trim();

    if (!user.facilityAccess.includes(normalizedFacility)) {
      user.facilityAccess.push(normalizedFacility);
      user.facilityAccess = [...new Set(user.facilityAccess)];
    }

    user.isApproved = true;
    await user.save();

    res.json({ message: `Access to ${normalizedFacility} granted.` });
  } catch (err) {
    console.error('❌ approveFacilityAccess error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
