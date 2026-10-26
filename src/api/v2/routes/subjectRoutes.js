import express from "express";
import subjectRoutesV1 from "../../v1/routes/subjectRoutes.js";

const router = express.Router();

router.use("/", subjectRoutesV1);

export default router;
