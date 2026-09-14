import { afterEach, describe, expect, it } from "vitest";

import request from "supertest";

import app from "../src/app.js";

import prisma from "../src/config/database.js";

const createdQuestionIds = [];
const createdSubjectIds = [];
const createdUserIds = [];

function uniqueEmail(label) {
  return `aula05-${label}-${Date.now()}-${Math.random()}@example.com`;
}

async function createUser(overrides = {}) {
  const response = await request(app)
    .post("/users")
    .send({
      nome: "Prof. Teste",
      email: uniqueEmail("user"),
      ...overrides,
    });

  if (response.status === 201) {
    createdUserIds.push(response.body.data.id);
  }

  return response;
}

async function createSubject(overrides = {}) {
  const user = await createUser();

  const response = await request(app)
    .post("/subjects")
    .send({
      nome: "Matéria de teste",
      professorId: user.body.data.id,
      ...overrides,
    });

  if (response.status === 201) {
    createdSubjectIds.push(response.body.data.id);
  }

  return { response, user };
}

async function createQuestion(overrides = {}) {
  const { response: subjectResponse, user } = await createSubject();

  const response = await request(app)
    .post("/questions")
    .send({
      enunciado: "Questão de teste",
      dificuldade: 1,
      subjectId: subjectResponse.body.data.id,
      authorId: user.body.data.id,
      ...overrides,
    });

  if (response.status === 201) {
    createdQuestionIds.push(response.body.data.id);
  }

  return { response, subjectResponse, user };
}

afterEach(async () => {
  if (createdQuestionIds.length > 0) {
    await prisma.question.deleteMany({
      where: { id: { in: createdQuestionIds.splice(0) } },
    });
  }

  if (createdSubjectIds.length > 0) {
    await prisma.subject.deleteMany({
      where: { id: { in: createdSubjectIds.splice(0) } },
    });
  }

  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds.splice(0) } },
    });
  }
});

describe("Subject API", () => {
  it("cria uma matéria", async () => {
    const { response, user } = await createSubject();

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nome).toBe("Matéria de teste");
    expect(response.body.data.professor.id).toBe(user.body.data.id);
  });

  it("lista matérias", async () => {
    const response = await request(app).get("/subjects");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBe(response.body.data.length);
  });

  it("busca matéria por ID", async () => {
    const { response } = await createSubject();
    const subjectId = response.body.data.id;

    const found = await request(app).get(`/subjects/${subjectId}`);

    expect(found.status).toBe(200);
    expect(found.body.success).toBe(true);
    expect(found.body.data.id).toBe(subjectId);
  });

  it("atualiza somente os campos enviados da matéria", async () => {
    const { response } = await createSubject({
      nome: "Nome original",
      ativa: true,
    });

    const subjectId = response.body.data.id;

    const updated = await request(app)
      .patch(`/subjects/${subjectId}`)
      .send({ nome: "Nome atualizado" });

    expect(updated.status).toBe(200);
    expect(updated.body.success).toBe(true);
    expect(updated.body.data.nome).toBe("Nome atualizado");
    expect(updated.body.data.ativa).toBe(true);
  });

  it("remove uma matéria sem questões vinculadas", async () => {
    const { response } = await createSubject();
    const subjectId = response.body.data.id;

    const removed = await request(app).delete(`/subjects/${subjectId}`);
    const found = await request(app).get(`/subjects/${subjectId}`);

    expect(removed.status).toBe(200);
    expect(removed.body.success).toBe(true);
    expect(removed.body.data.id).toBe(subjectId);
    expect(found.status).toBe(404);
  });

  it("rejeita ID e PATCH inválidos de matéria", async () => {
    const invalidId = await request(app).get("/subjects/abc");
    const invalidBody = await request(app)
      .patch("/subjects/abc")
      .send({ nome: "Teste" });

    expect(invalidId.status).toBe(400);
    expect(invalidBody.status).toBe(400);
  });

  it("retorna 404 para professor inexistente", async () => {
    const response = await request(app).post("/subjects").send({
      nome: "Matéria inválida",
      professorId: 999999999,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 para matéria inexistente", async () => {
    const response = await request(app).get("/subjects/999999999");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("impede excluir matéria com questão vinculada", async () => {
    const { subjectResponse } = await createQuestion();
    const subjectId = subjectResponse.body.data.id;

    const response = await request(app).delete(`/subjects/${subjectId}`);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});

describe("Question API", () => {
  it("cria uma questão", async () => {
    const { response, subjectResponse, user } = await createQuestion();

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.enunciado).toBe("Questão de teste");
    expect(response.body.data.subject.id).toBe(subjectResponse.body.data.id);
    expect(response.body.data.author.id).toBe(user.body.data.id);
  });

  it("lista questões", async () => {
    const response = await request(app).get("/questions");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBe(response.body.data.length);
  });

  it("busca questão por ID", async () => {
    const { response } = await createQuestion();
    const questionId = response.body.data.id;

    const found = await request(app).get(`/questions/${questionId}`);

    expect(found.status).toBe(200);
    expect(found.body.success).toBe(true);
    expect(found.body.data.id).toBe(questionId);
  });

  it("atualiza somente os campos enviados da questão", async () => {
    const { response } = await createQuestion({
      enunciado: "Enunciado original",
      dificuldade: 1,
      ativa: true,
    });

    const questionId = response.body.data.id;

    const updated = await request(app)
      .patch(`/questions/${questionId}`)
      .send({ enunciado: "Enunciado atualizado" });

    expect(updated.status).toBe(200);
    expect(updated.body.success).toBe(true);
    expect(updated.body.data.enunciado).toBe("Enunciado atualizado");
    expect(updated.body.data.dificuldade).toBe(1);
    expect(updated.body.data.ativa).toBe(true);
  });

  it("remove uma questão", async () => {
    const { response } = await createQuestion();
    const questionId = response.body.data.id;

    const removed = await request(app).delete(`/questions/${questionId}`);
    const found = await request(app).get(`/questions/${questionId}`);

    expect(removed.status).toBe(200);
    expect(removed.body.success).toBe(true);
    expect(removed.body.data.id).toBe(questionId);
    expect(found.status).toBe(404);
  });

  it("rejeita ID e PATCH inválidos de questão", async () => {
    const invalidId = await request(app).get("/questions/abc");
    const invalidBody = await request(app)
      .patch("/questions/abc")
      .send({ enunciado: "Teste" });

    expect(invalidId.status).toBe(400);
    expect(invalidBody.status).toBe(400);
  });

  it("retorna 404 para matéria inexistente ao criar questão", async () => {
    const user = await createUser();

    const response = await request(app).post("/questions").send({
      enunciado: "Questão inválida",
      dificuldade: 1,
      subjectId: 999999999,
      authorId: user.body.data.id,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 para autor inexistente ao criar questão", async () => {
    const { response: subjectResponse } = await createSubject();

    const response = await request(app).post("/questions").send({
      enunciado: "Questão inválida",
      dificuldade: 1,
      subjectId: subjectResponse.body.data.id,
      authorId: 999999999,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 para questão inexistente", async () => {
    const response = await request(app).get("/questions/999999999");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("rejeita dificuldade inválida", async () => {
    const { user, response: subjectResponse } = await createSubject();

    const response = await request(app).post("/questions").send({
      enunciado: "Questão inválida",
      dificuldade: 4,
      subjectId: subjectResponse.body.data.id,
      authorId: user.body.data.id,
    });

    expect(response.status).toBe(400);
  });

  it("rejeita PATCH vazio", async () => {
    const { response } = await createQuestion();
    const questionId = response.body.data.id;

    const updated = await request(app)
      .patch(`/questions/${questionId}`)
      .send({});

    expect(updated.status).toBe(400);
  });
});
