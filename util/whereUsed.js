import { Book } from '../models/bookModel.js';

export async function whereUsedPortalLink(id) {
  const planCodes = await PlanCode.countDocuments({ portals: id });
  // Book supports both legacy portalLinks and (optionally) new portals[]
  const plans = await Book.countDocuments({ $or: [{ portalLinks: id }, { portals: id }] });
  return { planCodes, plans };
}

export async function whereUsedContact(id) {
  const planCodes = await PlanCode.countDocuments({ contacts: id });
  const plans = await Book.countDocuments({ contacts: id });
  return { planCodes, plans };
}

export async function whereUsedAddressHub(id) {
  const planCodes = await PlanCode.countDocuments({
    $or: [{ facilityAddress: id }, { providerAddress: id }]
  });
  return { planCodes };
}

export async function whereUsedPayer(id) {
  const planCodes = await PlanCode.countDocuments({ payer: id });
  const plans = await Book.countDocuments({ payer: id });
  return { planCodes, plans };
}

export async function whereUsedPlanCode(id) {
  const plans = await Book.countDocuments({ planCode: id });
  return { plans };
}
