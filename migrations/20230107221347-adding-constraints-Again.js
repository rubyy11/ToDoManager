"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Todos", "title", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: {
          args: 5,
          msg: "oops!!! length is less than 5(sequelize) ",
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Todos", "title", {
      type: Sequelize.STRING,
    });
  },
};
