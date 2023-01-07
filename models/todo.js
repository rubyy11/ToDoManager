"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }

    static getTodos() {
      return this.findAll();
    }

    static async remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    //changessss...........

    static async overdue(userId) {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      try {
        const l1 = await Todo.findAll({
          where: {
            dueDate: { [Op.lt]: new Date() },
            userId,
            completed: false,
          },
        });
        return l1;
      } catch (error) {
        console.log(error);
      }
    }
    static async completedtodos(userId) {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      // retrieve items from table
      // return list of items where due date is less than todays date
      try {
        const completedTodos = await Todo.findAll({
          where: {
            completed: true,
            userId,
          },
        });
        return completedTodos;
      } catch (error) {
        console.log(error);
      }
    }

    static async dueToday(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      try {
        const l2 = await Todo.findAll({
          where: {
            dueDate: { [Op.eq]: new Date() },
            userId,
            completed: false,
          },
        });
        return l2;
      } catch (error) {
        console.log(error);
      }
    }

    static async dueLater(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      try {
        const l3 = await Todo.findAll({
          where: {
            dueDate: { [Op.gt]: new Date() },
            userId,
            completed: false,
          },
        });
        return l3;
      } catch (error) {
        console.log(error);
      }
    }
    setCompletionStatus(l4, userId) {
      return this.update(
        {
          completed: l4,
        },
        {
          where: userId,
        }
      );
    }

    //changes endss...........

    deleted() {
      this.destroy();
      return true;
    }
  }

  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 5,
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
