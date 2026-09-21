import * as questionService from "../services/questionService.js";
import { NotFoundError } from "../errors/AppError.js";

export const create = async (req, res, next) => {
  try {
    const result = await questionService.createQuestion(req.body);

    return res.status(201).json({
      success: true,
      message: "Questão criada com sucesso",
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAll = async (_req, res, next) => {
  try {
    const questions = await questionService.getAllQuestions();

    return res.status(200).json({
      success: true,
      data: questions,
      total: questions.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const question = await questionService.getQuestionById(req.params.id);

    if (!question) {
      throw new NotFoundError("Questão não encontrada");
    }

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const result = await questionService.updateQuestion(
      req.params.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Questão atualizada com sucesso",
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await questionService.deleteQuestion(req.params.id);

    if (!result.ok && result.reason === "NOT_FOUND") {
      throw new NotFoundError("Questão não encontrada");
    }

    return res.status(200).json({
      success: true,
      message: "Questão removida com sucesso",
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};
