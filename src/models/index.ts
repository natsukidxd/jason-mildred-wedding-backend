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
class RSVP extends Model {}
RSVP.init({
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
  attendance: {
    type: DataTypes.ENUM('Attending', 'Not Attending'),
    allowNull: false,
  },
  guests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1, max: 2 },
  },
  wishes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'rsvps',
  timestamps: true,
  updatedAt: false,
});

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