"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    static getTodos() {
      return this.findAll();
    }
    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    //changessss...........

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      try {
        const l1 = await Todo.findAll({
          where: {
            dueDate: { [Op.lt]: new Date() },
            completed: false,
          },
        });
        return l1;
      } catch (error) {
        console.log(error);
      }
    }
    static async completedtodos() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      // retrieve items from table
      // return list of items where due date is less than todays date
      try {
        const completedTodos = await Todo.findAll({
          where: {
            completed: true,
          },
        });
        return completedTodos;
      } catch (error) {
        console.log(error);
      }
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      try {
        const l2 = await Todo.findAll({
          where: {
            dueDate: { [Op.eq]: new Date() },
            completed: false,
          },
        });
        return l2;
      } catch (error) {
        console.log(error);
      }
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      try {
        const l3 = await Todo.findAll({
          where: {
            dueDate: { [Op.gt]: new Date() },
            completed: false,
          },
        });
        return l3;
      } catch (error) {
        console.log(error);
      }
    }
    setCompletionStatus(l4) {
      return this.update({
        completed: l4,
      });
    }

    //changes endss...........

    deleted() {
      this.destroy();
      return true;
    }
  }

  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
