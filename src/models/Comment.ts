import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index';
import RSVP, { associate as associateRSVP } from './RSVP';

class Comment extends Model {
  public id!: string;
  public name!: string;
  public message!: string;
  public attendance!: string;
}

Comment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
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
  indexes: [
    {
      fields: ['createdAt'],
    },
  ],
});

// Define associations
RSVP.hasMany(Comment, { foreignKey: 'name', sourceKey: 'name' });
Comment.belongsTo(RSVP, { foreignKey: 'name', targetKey: 'name' });

function associate(models: any) {
  if (models.RSVP && models.Comment) {
    models.RSVP.hasMany(models.Comment, { foreignKey: 'name', sourceKey: 'name' });
    models.Comment.belongsTo(models.RSVP, { foreignKey: 'name', targetKey: 'name' });
  }
}

export { Comment, associate };
export default Comment;
