import bcrypt from 'bcryptjs';
import { connectDb } from '../src/config/db.js';
import { Department, User } from '../src/models/mongoSchemas.js';

const DEFAULT_PASSWORD = 'Password123!';

async function seed() {
  await connectDb();

  const departmentNames = ['Finance', 'Marketing', 'Operations', 'Engineering', 'Research'];
  const departments = [];

  for (const name of departmentNames) {
    const dept = await Department.findOneAndUpdate({ name }, { $setOnInsert: { name } }, { upsert: true, new: true });
    departments.push(dept);
  }

  const engineering = departments.find((d) => d.name === 'Engineering');
  const finance = departments.find((d) => d.name === 'Finance');
  const research = departments.find((d) => d.name === 'Research');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users = [
    {
      usid: 'ADM001',
      name: 'System Admin',
      email: 'admin@ddas.local',
      role: 'ADMIN',
      departmentId: engineering?._id
    },
    {
      usid: 'RSH001',
      name: 'Lead Researcher',
      email: 'researcher@ddas.local',
      role: 'RESEARCHER',
      departmentId: research?._id
    },
    {
      usid: 'VIW001',
      name: 'Data Viewer',
      email: 'viewer@ddas.local',
      role: 'VIEWER',
      departmentId: finance?._id
    }
  ];

  for (const user of users) {
    await User.findOneAndUpdate(
      { usid: user.usid },
      {
        $set: {
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          passwordHash
        }
      },
      { upsert: true, new: true }
    );
  }

  console.log('Seed complete. Demo users reset to Password123!: ADM001, RSH001, VIW001');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
