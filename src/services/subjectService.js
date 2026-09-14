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
  createdAt: true,
  professor: { select: publicUserSelect },
};

export const getAllSubjects = async () => {
  return prisma.subject.findMany({
    select: publicSubjectSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const getSubjectById = async (subjectId) => {
  return prisma.subject.findUnique({
    where: { id: subjectId },
    select: publicSubjectSelect,
  });
};

export const createSubject = async (subjectData) => {
  const professor = await prisma.user.findUnique({
    where: { id: subjectData.professorId },
    select: { id: true },
  });

  if (!professor) {
    return { ok: false, reason: "PROFESSOR_NOT_FOUND" };
  }

  const materia = await prisma.subject.create({
    data: {
      nome: subjectData.nome.trim(),
      professorId: subjectData.professorId,
      ativa: subjectData.ativa ?? true,
    },
    select: publicSubjectSelect,
  });

  return { ok: true, data: materia };
};

export const updateSubject = async (subjectId, subjectData) => {
  const materiaExistente = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!materiaExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const data = {};

  if (Object.hasOwn(subjectData, "nome")) {
    data.nome = subjectData.nome.trim();
  }

  if (Object.hasOwn(subjectData, "ativa")) {
    data.ativa = subjectData.ativa;
  }

  if (Object.hasOwn(subjectData, "professorId")) {
    const professor = await prisma.user.findUnique({
      where: { id: subjectData.professorId },
      select: { id: true },
    });

    if (!professor) {
      return { ok: false, reason: "PROFESSOR_NOT_FOUND" };
    }

    data.professorId = subjectData.professorId;
  }

  const materia = await prisma.subject.update({
    where: { id: subjectId },
    data,
    select: publicSubjectSelect,
  });

  return { ok: true, data: materia };
};

export const deleteSubject = async (subjectId) => {
  const materiaExistente = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      ...publicSubjectSelect,
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!materiaExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (materiaExistente._count.questions > 0) {
    return { ok: false, reason: "SUBJECT_IN_USE" };
  }

  try {
    const materia = await prisma.subject.delete({
      where: { id: subjectId },
      select: publicSubjectSelect,
    });

    return { ok: true, data: materia };
  } catch (error) {
    if (error.code === "P2003" || error.code === "P2014") {
      return { ok: false, reason: "SUBJECT_IN_USE" };
    }

    throw error;
  }
};
