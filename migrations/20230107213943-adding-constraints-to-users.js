"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Users", "firstName", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 1,
          msg: "very short name",
        },
      },
    }),
      await queryInterface.changeColumn("Users", "email", {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Already existing Email",
        },
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Enter an email",
          },
        },
      }),
      await queryInterface.changeColumn("Users", "password", {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          async checkpwd(pwd) {
            if (await bcrypt.compare("", pwd)) {
              throw new Error("Incorrect password");
            }
          },
        },
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Users", "firstName", {
      type: Sequelize.STRING,
    }),
      await queryInterface.changeColumn("Users", "email", {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      }),
      await queryInterface.changeColumn("Users", "password", {
        type: Sequelize.STRING,
      });
  },
};
