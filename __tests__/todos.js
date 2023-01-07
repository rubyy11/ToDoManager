const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Signup", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "1234");
    const res = await agent.get("/todos");
    const csrftoken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrftoken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "1234");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const c1 = parsedGroupedResponse.duetoday.length;
    const newtodo = parsedGroupedResponse.duetoday[c1 - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${newtodo.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  //test 3.......

  // test("Fetches all todos in the database using /todos endpoint", async () => {
  //   await agent.post("/todos").send({
  //     title: "Buy xbox",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   await agent.post("/todos").send({
  //     title: "Buy ps3",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   const response = await agent.get("/todos");
  //   const parsedResponse = JSON.parse(response.text);

  //   expect(parsedResponse.length).toBe(4);
  //   expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  // });
  // test("Marks a todo with the given ID as incomplete", async () => {
  //   let res = await agent.get("/todos");
  //   let csrfToken = extractCsrfToken(res);
  //   await agent.post("/todos").send({
  //     title: "Buy milk",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //     _csrf: csrfToken,
  //   });

  //   const groupedTodosResponse = await agent
  //     .get("/todos")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
  //   const c1 = parsedGroupedResponse.duetoday.length;
  //   const newtodo = parsedGroupedResponse.duetoday[c1 - 1];

  //   res = await agent.get("/todos");
  //   csrfToken = extractCsrfToken(res);

  //   const markCompleteResponse = await agent.put(`/todos/${newtodo.id}`).send({
  //     _csrf: csrfToken,
  //     completed: true,
  //   });

  //   const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
  //   expect(parsedUpdateResponse.completed).toBe(true);

  //   res = await agent.get("/");
  //   csrfToken = extractCsrfToken(res);

  //   const markIncompleteResponse = await agent
  //     .put(`/todos/${newtodo.id}`)
  //     .send({
  //       _csrf: csrfToken,
  //       completed: false,
  //     });
  //   console.log(markIncompleteResponse.text);
  //   const incompletecheck = JSON.parse(markIncompleteResponse.text);
  //   expect(incompletecheck.completed).toBe(false);
  // });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "1234");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const c = parsedGroupedResponse.duetoday.length;
    const newtodoele = parsedGroupedResponse.duetoday[c - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const dlresponse = await agent.delete(`/todos/${newtodoele.id}`).send({
      _csrf: csrfToken,
    });

    const parseddeletedvalue = JSON.parse(dlresponse.text);
    expect(parseddeletedvalue.success).toBe(true);
  });

  test("tests to verify userA cannot update or delete userB's todo", async () => {
    var agent = request.agent(server);
    await login(agent, "user.a@test.com", "1234");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const c1 = parsedGroupedResponse.duetoday.length;
    const newtodo = parsedGroupedResponse.duetoday[c1 - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    let markCompleteResponse = await agent.put(`/todos/${newtodo.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);

    res = await agent.get("/signout");

    agent = request.agent(server);
    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User B",
      email: "user.b@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    markCompleteResponse = await agent.put(`/todos/${newtodo.id}`).send({
      _csrf: csrfToken,
      completionStatus: true,
    });

    expect(markCompleteResponse.statusCode).toBe(200);
  });
});
