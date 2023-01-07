"use strict";
const bcrypt = require("bcrypt");
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Todo, {
        foreignKey: "userId",
      });
    }
  }
  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Proper first name required!",
          },
        },
      },
      lastName: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Email already exists",
        },
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Proper email required!",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          async checkpwd(pwd) {
            if (await bcrypt.compare("", pwd)) {
              throw new Error("Invalid password");
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
