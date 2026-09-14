import prisma from "../config/database.js";

const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  foto: true,
};

const publicSubjectSelect = {
  id: true,
  nome: true,
  ativa: true,
};

const publicQuestionSelect = {
  id: true,
  enunciado: true,
  dificuldade: true,
  respostaCorreta: true,
  ativa: true,
  createdAt: true,
  subject: { select: publicSubjectSelect },
  author: { select: publicUserSelect },
};

export const getAllQuestions = async () => {
  return prisma.question.findMany({
    select: publicQuestionSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const getQuestionById = async (questionId) => {
  return prisma.question.findUnique({
    where: { id: questionId },
    select: publicQuestionSelect,
  });
};

export const createQuestion = async (questionData) => {
  const subject = await prisma.subject.findUnique({
    where: { id: questionData.subjectId },
    select: { id: true },
  });

  if (!subject) {
    return { ok: false, reason: "SUBJECT_NOT_FOUND" };
  }

  const author = await prisma.user.findUnique({
    where: { id: questionData.authorId },
    select: { id: true },
  });

  if (!author) {
    return { ok: false, reason: "AUTHOR_NOT_FOUND" };
  }

  const questao = await prisma.question.create({
    data: {
      enunciado: questionData.enunciado.trim(),
      dificuldade: questionData.dificuldade,
      respostaCorreta: questionData.respostaCorreta?.trim() || null,
      subjectId: questionData.subjectId,
      authorId: questionData.authorId,
      ativa: questionData.ativa ?? true,
    },
    select: publicQuestionSelect,
  });

  return { ok: true, data: questao };
};

export const updateQuestion = async (questionId, questionData) => {
  const questaoExistente = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!questaoExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const data = {};

  if (Object.hasOwn(questionData, "enunciado")) {
    data.enunciado = questionData.enunciado.trim();
  }

  if (Object.hasOwn(questionData, "dificuldade")) {
    data.dificuldade = questionData.dificuldade;
  }

  if (Object.hasOwn(questionData, "respostaCorreta")) {
    data.respostaCorreta = questionData.respostaCorreta?.trim() || null;
  }

  if (Object.hasOwn(questionData, "ativa")) {
    data.ativa = questionData.ativa;
  }

  if (Object.hasOwn(questionData, "subjectId")) {
    const subject = await prisma.subject.findUnique({
      where: { id: questionData.subjectId },
      select: { id: true },
    });

    if (!subject) {
      return { ok: false, reason: "SUBJECT_NOT_FOUND" };
    }

    data.subjectId = questionData.subjectId;
  }

  if (Object.hasOwn(questionData, "authorId")) {
    const author = await prisma.user.findUnique({
      where: { id: questionData.authorId },
      select: { id: true },
    });

    if (!author) {
      return { ok: false, reason: "AUTHOR_NOT_FOUND" };
    }

    data.authorId = questionData.authorId;
  }

  const questao = await prisma.question.update({
    where: { id: questionId },
    data,
    select: publicQuestionSelect,
  });

  return { ok: true, data: questao };
};

export const deleteQuestion = async (questionId) => {
  const questaoExistente = await prisma.question.findUnique({
    where: { id: questionId },
    select: publicQuestionSelect,
  });

  if (!questaoExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  try {
    const questao = await prisma.question.delete({
      where: { id: questionId },
      select: publicQuestionSelect,
    });

    return { ok: true, data: questao };
  } catch (error) {
    if (error.code === "P2003" || error.code === "P2014") {
      return { ok: false, reason: "QUESTION_IN_USE" };
    }

    throw error;
  }
};
