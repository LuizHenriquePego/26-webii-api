import * as subjectService from "../services/subjectService.js";

function toPositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export const create = async (req, res) => {
  try {
    const { nome, professorId, ativa } = req.body;
    const professorIdNumber = toPositiveInt(professorId);

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      !professorIdNumber ||
      (ativa !== undefined && typeof ativa !== "boolean")
    ) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
      });
    }

    const result = await subjectService.createSubject({
      nome,
      professorId: professorIdNumber,
      ativa,
    });

    if (!result.ok && result.reason === "PROFESSOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: `Professor com ID ${professorIdNumber} não encontrado`,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Matéria criada com sucesso",
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao criar matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar matéria",
    });
  }
};

export const getAll = async (_req, res) => {
  try {
    const materias = await subjectService.getAllSubjects();

    return res.status(200).json({
      success: true,
      data: materias,
      total: materias.length,
    });
  } catch (error) {
    console.error("Erro ao listar matérias:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao listar matérias",
    });
  }
};

export const getById = async (req, res) => {
  try {
    const subjectId = toPositiveInt(req.params.id);

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "ID inválido. Deve ser um número inteiro positivo",
      });
    }

    const materia = await subjectService.getSubjectById(subjectId);

    if (!materia) {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID ${subjectId} não encontrada`,
      });
    }

    return res.status(200).json({
      success: true,
      data: materia,
    });
  } catch (error) {
    console.error("Erro ao buscar matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar matéria",
    });
  }
};

export const update = async (req, res) => {
  try {
    const subjectId = toPositiveInt(req.params.id);

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "ID inválido. Deve ser um número inteiro positivo",
      });
    }

    const { nome, ativa, professorId } = req.body;
    const allowedFields = ["nome", "ativa", "professorId"];
    const hasAllowedField = allowedFields.some((field) =>
      Object.hasOwn(req.body, field),
    );

    if (!hasAllowedField) {
      return res.status(400).json({
        success: false,
        message: "Informe ao menos um campo válido para atualização",
      });
    }

    if (
      Object.hasOwn(req.body, "nome") &&
      (typeof nome !== "string" || !nome.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Nome inválido",
      });
    }

    if (Object.hasOwn(req.body, "ativa") && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Ativa deve ser booleana",
      });
    }

    let professorIdNumber;

    if (Object.hasOwn(req.body, "professorId")) {
      professorIdNumber = toPositiveInt(professorId);

      if (!professorIdNumber) {
        return res.status(400).json({
          success: false,
          message: "professorId deve ser um número inteiro positivo",
        });
      }
    }

    const result = await subjectService.updateSubject(subjectId, {
      ...(Object.hasOwn(req.body, "nome") && { nome }),
      ...(Object.hasOwn(req.body, "ativa") && { ativa }),
      ...(Object.hasOwn(req.body, "professorId") && {
        professorId: professorIdNumber,
      }),
    });

    if (!result.ok && result.reason === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID ${subjectId} não encontrada`,
      });
    }

    if (!result.ok && result.reason === "PROFESSOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: `Professor com ID ${professorIdNumber} não encontrado`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Matéria atualizada com sucesso",
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao atualizar matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar matéria",
    });
  }
};

export const remove = async (req, res) => {
  try {
    const subjectId = toPositiveInt(req.params.id);

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "ID inválido. Deve ser um número inteiro positivo",
      });
    }

    const result = await subjectService.deleteSubject(subjectId);

    if (!result.ok && result.reason === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID ${subjectId} não encontrada`,
      });
    }

    if (!result.ok && result.reason === "SUBJECT_IN_USE") {
      return res.status(409).json({
        success: false,
        message: "Não é possível excluir uma matéria que possui questões",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Matéria excluída com sucesso",
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao excluir matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao excluir matéria",
    });
  }
};
