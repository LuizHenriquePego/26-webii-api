import express from "express";
import questionRoutesV1 from "../../v1/routes/questionRoutes.js";

const router = express.Router();

router.use("/", questionRoutesV1);

export default router;
