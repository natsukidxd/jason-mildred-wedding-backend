import { Model, DataTypes } from 'sequelize';

class RSVP extends Model {
  public id!: string;
  public name!: string;
  public attendance!: string;
  public guests!: number;
  public wishes!: string;
  public guestNames!: string[];
}

function initRSVP(sequelize: any) {
  RSVP.init({
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
    attendance: {
      type: DataTypes.ENUM('Attending', 'Not Attending'),
      allowNull: false,
    },
    guests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 10,
      },
    },
    wishes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    guestNames: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
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

  return RSVP;
}

// Associations
function associate(models: any) {
  if (models.RSVP && models.Comment) {
    models.RSVP.hasMany(models.Comment, { foreignKey: 'name', sourceKey: 'name' });
    models.Comment.belongsTo(models.RSVP, { foreignKey: 'name', targetKey: 'name' });
  }
}

export { RSVP, initRSVP, associate };
export default RSVP;
