// ADICIONADO: rotas relativas V2 com schemas próprios e middleware compartilhado.
import express from "express";
import uploadPhoto from "../../../config/multer.js";
import * as userController from "../controllers/userController.js";
import validate from "../../../middlewares/validate.js";
import {
  createUserV2Schema,
  idParamSchema,
  updateUserV2Schema,
} from "../schemas/userSchema.js";
import { ValidationError } from "../../../errors/AppError.js";

const router = express.Router();

function validateUpdateBody(req, res, next) {
  const result = updateUserV2Schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    }));

    return next(new ValidationError("Dados de entrada inválidos", details));
  }

  if (Object.keys(result.data).length === 0 && !req.file) {
    return next(
      new ValidationError("Envie pelo menos um campo para atualização"),
    );
  }

  req.body = result.data;
  return next();
}

router.post(
  "/",
  uploadPhoto,
  validate(createUserV2Schema),
  userController.create,
);
router.get("/", userController.getAll);
router.get("/:id", validate(idParamSchema, "params"), userController.getById);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  uploadPhoto,
  validateUpdateBody,
  userController.update,
);
router.delete("/:id", validate(idParamSchema, "params"), userController.remove);

export default router;
