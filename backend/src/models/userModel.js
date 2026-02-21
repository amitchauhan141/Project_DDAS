import { User, UserSession } from './mongoSchemas.js';

function mapUser(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    usid: doc.usid,
    name: doc.name,
    email: doc.email,
    password_hash: doc.passwordHash,
    department_id: doc.departmentId ? doc.departmentId.toString() : null,
    role: doc.role
  };
}

export async function findUserByUsid(usid) {
  const doc = await User.findOne({ usid: String(usid || '').toUpperCase() }).lean();
  return mapUser(doc);
}

export async function findUserByEmail(email) {
  const doc = await User.findOne({ email: String(email || '').toLowerCase() }).lean();
  return mapUser(doc);
}

export async function findUserById(id) {
  const doc = await User.findById(id).lean();
  return mapUser(doc);
}

export async function createUserSession({ userId, tokenId, ipAddress, userAgent }) {
  const session = await UserSession.create({ userId, tokenId, ipAddress, userAgent, status: 'ACTIVE' });
  return {
    id: session._id.toString(),
    token_id: session.tokenId,
    user_id: session.userId.toString(),
    status: session.status,
    login_at: session.loginAt
  };
}

export async function findActiveSessionByTokenId(tokenId) {
  const session = await UserSession.findOne({ tokenId, status: 'ACTIVE' }).lean();
  if (!session) return null;
  return {
    id: session._id.toString(),
    token_id: session.tokenId,
    user_id: session.userId.toString(),
    status: session.status,
    login_at: session.loginAt
  };
}

export async function closeSessionByTokenId(tokenId) {
  const session = await UserSession.findOneAndUpdate(
    { tokenId, status: 'ACTIVE' },
    { $set: { status: 'LOGGED_OUT', logoutAt: new Date() } },
    { new: true }
  ).lean();

  return session
    ? {
        id: session._id.toString(),
        token_id: session.tokenId,
        status: session.status,
        logout_at: session.logoutAt
      }
    : null;
}
