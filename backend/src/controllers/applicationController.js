const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const Program = require("../models/Program");
const Student = require("../models/Student");
const cacheService = require("../services/cacheService");
const { validStatusTransitions, applicationStatuses } = require("../config/constants");

const listApplications = asyncHandler(async (req, res) => {
  const { studentId, status } = req.query;
  const filters = {};

  if (studentId) {
    filters.student = studentId;
  }

  if (status) {
    filters.status = status;
  }

  const applications = await Application.find(filters)
    .populate("student", "fullName email role targetCountries interestedFields")
    .populate("program", "title degreeLevel tuitionFeeUsd intakes country")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: applications,
  });
});

const createApplication = asyncHandler(async (req, res) => {
  const { studentId, programId, intake, note } = req.body;

  // Use authenticated user ID or body studentId (if counselor creating for a student)
  const targetStudentId = studentId || (req.user ? req.user._id : null);

  if (!targetStudentId || !programId || !intake) {
    throw new HttpError(400, "studentId, programId, and intake are required.");
  }

  // Verify student exists
  const student = await Student.findById(targetStudentId);
  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  // Verify program exists
  const program = await Program.findById(programId).populate("university");
  if (!program) {
    throw new HttpError(404, "Program not found.");
  }

  // Validate that the requested intake is supported by the program
  if (program.intakes?.length > 0 && !program.intakes.includes(intake)) {
    throw new HttpError(
      400,
      `Invalid intake '${intake}'. Available intakes are: ${program.intakes.join(", ")}`
    );
  }

  // Check for duplicate application for (student, program, intake)
  const existingApplication = await Application.findOne({
    student: targetStudentId,
    program: programId,
    intake,
  });

  if (existingApplication) {
    throw new HttpError(
      409,
      `An application for this student, program, and intake (${intake}) already exists with status '${existingApplication.status}'.`
    );
  }

  const initialNote = note || "Application created and submitted for review.";

  const application = await Application.create({
    student: targetStudentId,
    program: programId,
    university: program.university?._id || program.university,
    destinationCountry: program.country,
    intake,
    status: "submitted",
    timeline: [
      {
        status: "draft",
        note: "Draft application initiated.",
        changedAt: new Date(Date.now() - 1000),
      },
      {
        status: "submitted",
        note: initialNote,
        changedAt: new Date(),
      },
    ],
  });

  // Invalidate dashboard overview cache
  cacheService.delete("dashboard-overview");

  const populated = await Application.findById(application._id)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd intakes country")
    .populate("university", "name country city");

  res.status(201).json({
    success: true,
    message: "Application submitted successfully.",
    data: populated,
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status: nextStatus, note } = req.body;

  if (!nextStatus) {
    throw new HttpError(400, "New status is required.");
  }

  if (!applicationStatuses.includes(nextStatus)) {
    throw new HttpError(
      400,
      `Invalid status '${nextStatus}'. Allowed statuses: ${applicationStatuses.join(", ")}`
    );
  }

  const application = await Application.findById(id);
  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  const currentStatus = application.status;

  // Validate allowed status transitions according to state machine
  const allowedNextTransitions = validStatusTransitions[currentStatus] || [];
  if (!allowedNextTransitions.includes(nextStatus)) {
    throw new HttpError(
      400,
      `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions are: ${
        allowedNextTransitions.length > 0
          ? allowedNextTransitions.join(", ")
          : "none (final terminal state)"
      }`
    );
  }

  // Update status and push into timeline
  application.status = nextStatus;
  application.timeline.push({
    status: nextStatus,
    note: note || `Status transitioned from ${currentStatus} to ${nextStatus}.`,
    changedAt: new Date(),
  });

  await application.save();

  // Invalidate dashboard overview cache
  cacheService.delete("dashboard-overview");

  const updated = await Application.findById(application._id)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd intakes country")
    .populate("university", "name country city");

  res.json({
    success: true,
    message: `Application status updated to ${nextStatus}.`,
    data: updated,
  });
});

module.exports = {
  createApplication,
  listApplications,
  updateApplicationStatus,
};
