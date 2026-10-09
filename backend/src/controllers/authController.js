const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

function generateToken(user) {
  return jwt.sign(
    { sub: user._id, role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    role = "student",
    targetCountries,
    interestedFields,
    preferredIntake,
    maxBudgetUsd,
    englishTest,
  } = req.body;

  if (!fullName || !email || !password) {
    throw new HttpError(400, "Full name, email, and password are required.");
  }

  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long.");
  }

  const existingUser = await Student.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new HttpError(409, "A user with this email address already exists.");
  }

  const user = await Student.create({
    fullName,
    email,
    password,
    role: ["student", "counselor"].includes(role) ? role : "student",
    targetCountries: targetCountries || [],
    interestedFields: interestedFields || [],
    preferredIntake: preferredIntake || "",
    maxBudgetUsd: maxBudgetUsd ? Number(maxBudgetUsd) : undefined,
    englishTest: englishTest || { exam: "IELTS", score: 0 },
    profileComplete: Boolean(targetCountries?.length || interestedFields?.length),
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: "Registration successful.",
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        targetCountries: user.targetCountries,
        interestedFields: user.interestedFields,
        preferredIntake: user.preferredIntake,
        maxBudgetUsd: user.maxBudgetUsd,
        englishTest: user.englishTest,
      },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  const user = await Student.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = generateToken(user);

  res.json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        targetCountries: user.targetCountries,
        interestedFields: user.interestedFields,
        preferredIntake: user.preferredIntake,
        maxBudgetUsd: user.maxBudgetUsd,
        englishTest: user.englishTest,
      },
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  register,
  login,
  me,
};
