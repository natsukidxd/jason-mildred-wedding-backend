import { sequelize } from '../models';

async function migrate() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();