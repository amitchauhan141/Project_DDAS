import { connectDb } from '../src/config/db.js';
import { Dataset, User } from '../src/models/mongoSchemas.js';

async function seedSamples() {
  await connectDb();

  const users = await User.find({ usid: { $in: ['ADM001', 'RSH001', 'VIW001'] } }).lean();
  const byUsid = new Map(users.map((u) => [u.usid, u]));

  const samples = [
    {
      usid: 'ADM001',
      name: 'adm_sales_report.csv',
      sizeBytes: 20480,
      sourceUrl: 'https://example.com/adm_sales_report.csv'
    },
    {
      usid: 'RSH001',
      name: 'rsh_experiment_data.csv',
      sizeBytes: 40960,
      sourceUrl: 'https://example.com/rsh_experiment_data.csv'
    },
    {
      usid: 'VIW001',
      name: 'viw_summary_view.xlsx',
      sizeBytes: 15360,
      sourceUrl: 'https://example.com/viw_summary_view.xlsx'
    }
  ];

  for (const sample of samples) {
    const user = byUsid.get(sample.usid);
    if (!user) {
      console.log(`Skipping ${sample.usid}: user not found`);
      continue;
    }

    await Dataset.findOneAndUpdate(
      { ownerId: user._id, name: sample.name, sourceType: 'BROWSER_DOWNLOAD', deletedAt: null },
      {
        $set: {
          ownerId: user._id,
          name: sample.name,
          filePath: `seed://${sample.name}`,
          sizeBytes: sample.sizeBytes,
          status: 'ACTIVE',
          sourceType: 'BROWSER_DOWNLOAD',
          sourceUrl: sample.sourceUrl,
          downloadedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log(`Seeded dataset for ${sample.usid}: ${sample.name}`);
  }

  console.log('Sample datasets seeded.');
  process.exit(0);
}

seedSamples().catch((err) => {
  console.error('Sample seed failed:', err.message);
  process.exit(1);
});
