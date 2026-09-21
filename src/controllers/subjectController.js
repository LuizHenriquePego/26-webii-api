import * as subjectService from "../services/subjectService.js";
import { NotFoundError } from "../errors/AppError.js";

export const create = async (req, res, next) => {
  try {
    const result = await subjectService.createSubject(req.body);

    return res.status(201).json({
      success: true,
      message: "Matéria criada com sucesso",
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAll = async (_req, res, next) => {
  try {
    const subjects = await subjectService.getAllSubjects();

    return res.status(200).json({
      success: true,
      data: subjects,
      total: subjects.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id);

    if (!subject) {
      throw new NotFoundError("Matéria não encontrada");
    }

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const result = await subjectService.updateSubject(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Matéria atualizada com sucesso",
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await subjectService.deleteSubject(req.params.id);

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        throw new NotFoundError("Matéria não encontrada");
      }

      if (result.reason === "SUBJECT_IN_USE") {
        return res.status(409).json({
          success: false,
          message: "Matéria possui questões vinculadas",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Matéria removida com sucesso",
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};
