import { Sequelize, Model, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = process.env.DATABASE_URL ? new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  ssl: true,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
} as any) : new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: true,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
} as any);

// RSVP Model
import { initRSVP } from './RSVP';
const RSVP = initRSVP(sequelize);

// Comment Model
class Comment extends Model {}
Comment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true },
  },
  attendance: {
    type: DataTypes.ENUM('Attending', 'Not Attending'),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'comments',
  timestamps: true,
  indexes: [{ fields: ['createdAt'] }],
});

export { sequelize, RSVP, Comment };
export default sequelize;