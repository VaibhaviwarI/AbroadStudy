const mongoose = require("mongoose");
const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

async function buildProgramRecommendations(studentId) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new HttpError(400, "Invalid student ID format.");
  }

  const student = await Student.findById(studentId).lean();

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  const targetCountries = student.targetCountries || [];
  const interestedFields = student.interestedFields || [];
  const preferredIntake = student.preferredIntake || "";
  const maxBudgetUsd = student.maxBudgetUsd || 0;
  const ieltsScore = student.englishTest?.score || 0;

  // Build MongoDB Aggregation Pipeline
  const pipeline = [];

  // Match: Candidates matching either target countries or within reasonable scope
  if (targetCountries.length > 0) {
    pipeline.push({
      $match: {
        country: { $in: targetCountries },
      },
    });
  }

  // Calculate scores and reasons using MongoDB Aggregation expressions
  pipeline.push({
    $addFields: {
      isCountryMatch: {
        $in: ["$country", targetCountries],
      },
      isFieldMatch: {
        $in: ["$field", interestedFields],
      },
      isBudgetMatch: {
        $lte: ["$tuitionFeeUsd", maxBudgetUsd > 0 ? maxBudgetUsd : 999999],
      },
      isIntakeMatch: {
        $in: [preferredIntake, "$intakes"],
      },
      isIeltsMatch: {
        $gte: [ieltsScore, "$minimumIelts"],
      },
    },
  });

  pipeline.push({
    $addFields: {
      matchScore: {
        $add: [
          { $cond: ["$isCountryMatch", 35, 0] },
          { $cond: ["$isFieldMatch", 30, 0] },
          { $cond: ["$isBudgetMatch", 20, 0] },
          { $cond: ["$isIntakeMatch", 10, 0] },
          { $cond: ["$isIeltsMatch", 5, 0] },
        ],
      },
      reasons: {
        $concatArrays: [
          {
            $cond: [
              "$isCountryMatch",
              [{ $concat: ["Preferred country match: ", "$country"] }],
              [],
            ],
          },
          {
            $cond: [
              "$isFieldMatch",
              [{ $concat: ["Field alignment: ", "$field"] }],
              [],
            ],
          },
          {
            $cond: [
              "$isBudgetMatch",
              ["Within budget range"],
              [],
            ],
          },
          {
            $cond: [
              "$isIntakeMatch",
              [{ $concat: ["Preferred intake available: ", preferredIntake] }],
              [],
            ],
          },
          {
            $cond: [
              "$isIeltsMatch",
              ["English test score meets requirement"],
              [],
            ],
          },
        ],
      },
    },
  });

  // Sort by match score descending, then by lower tuition fee
  pipeline.push({
    $sort: {
      matchScore: -1,
      tuitionFeeUsd: 1,
    },
  });

  // Limit to top 5 recommendations
  pipeline.push({
    $limit: 5,
  });

  // Project clean response fields
  pipeline.push({
    $project: {
      isCountryMatch: 0,
      isFieldMatch: 0,
      isBudgetMatch: 0,
      isIntakeMatch: 0,
      isIeltsMatch: 0,
    },
  });

  const recommendations = await Program.aggregate(pipeline);

  return {
    data: {
      student: {
        id: student._id,
        fullName: student.fullName,
        targetCountries: student.targetCountries,
        interestedFields: student.interestedFields,
        preferredIntake: student.preferredIntake,
        maxBudgetUsd: student.maxBudgetUsd,
        englishScore: ieltsScore,
      },
      recommendations,
    },
    meta: {
      implementationStatus: "mongodb-aggregation-pipeline",
      pipelineStagesCount: pipeline.length,
    },
  };
}

module.exports = {
  buildProgramRecommendations,
};
