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

function toPositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

// CREATE - Criar nova questão
export const create = async (req, res) => {
  try {
    const {
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId,
      authorId,
      ativa,
    } = req.body;

    if (
      typeof enunciado !== "string" ||
      !enunciado.trim() ||
      !toPositiveInt(dificuldade) ||
      !toPositiveInt(subjectId) ||
      !toPositiveInt(authorId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enunciado, dificuldade, subjectId e authorId são obrigatórios",
      });
    }

    const dificuldadeNumerica = toPositiveInt(dificuldade);
    const subjectIdNumerico = toPositiveInt(subjectId);
    const authorIdNumerico = toPositiveInt(authorId);

    if (![1, 2, 3].includes(dificuldadeNumerica)) {
      return res.status(400).json({
        success: false,
        message: "Dificuldade deve ser 1, 2 ou 3",
      });
    }

    const materia = await prisma.subject.findUnique({
      where: { id: subjectIdNumerico },
    });

    if (!materia) {
      return res.status(404).json({
        success: false,
        message: "Matéria não encontrada",
      });
    }

    const autor = await prisma.user.findUnique({
      where: { id: authorIdNumerico },
    });

    if (!autor) {
      return res.status(404).json({
        success: false,
        message: "Autor não encontrado",
      });
    }

    const novaQuestao = await prisma.question.create({
      data: {
        enunciado: enunciado.trim(),
        dificuldade: dificuldadeNumerica,
        respostaCorreta: respostaCorreta || null,
        subjectId: subjectIdNumerico,
        authorId: authorIdNumerico,
        ativa: ativa ?? true,
      },
      select: {
        id: true,
        enunciado: true,
        dificuldade: true,
        respostaCorreta: true,
        subjectId: true,
        authorId: true,
        ativa: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: publicSubjectSelect,
        },
        author: {
          select: publicUserSelect,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Questão criada com sucesso",
      data: novaQuestao,
    });
  } catch (error) {
    console.error("Erro ao criar questão:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar questão",
    });
  }
};

// READ - Listar todas as questões
export const getAll = async (_req, res) => {
  try {
    const questoes = await prisma.question.findMany({
      select: {
        id: true,
        enunciado: true,
        dificuldade: true,
        respostaCorreta: true,
        subjectId: true,
        authorId: true,
        ativa: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: publicSubjectSelect,
        },
        author: {
          select: publicUserSelect,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: questoes,
      total: questoes.length,
    });
  } catch (error) {
    console.error("Erro ao listar questões:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao listar questões",
    });
  }
};

// READ - Buscar questão por ID
export const getById = async (req, res) => {
  try {
    const questionId = toPositiveInt(req.params.id);

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "ID inválido. Deve ser um número inteiro positivo",
      });
    }

    const questao = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        enunciado: true,
        dificuldade: true,
        respostaCorreta: true,
        subjectId: true,
        authorId: true,
        ativa: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: publicSubjectSelect,
        },
        author: {
          select: publicUserSelect,
        },
      },
    });

    if (!questao) {
      return res.status(404).json({
        success: false,
        message: `Questão com ID ${questionId} não encontrada`,
      });
    }

    return res.status(200).json({
      success: true,
      data: questao,
    });
  } catch (error) {
    console.error("Erro ao buscar questão:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar questão",
    });
  }
};