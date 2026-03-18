import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDb } from '../src/config/db.js';
import { User } from '../src/models/mongoSchemas.js';

async function test() {
  await connectDb();
  const user = await User.findOne({ usid: 'RSH001' }).lean();
  console.log("User:", user?.usid);
  if (user) {
    const match = await bcrypt.compare('ResearchPassword1!', user.passwordHash);
    console.log("Password match for ResearchPassword1! :", match);
  } else {
    console.log("User not found!");
  }
  process.exit(0);
}

test().catch(console.error);
