const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const env = require("../src/config/env");
const Student = require("../src/models/Student");
const Program = require("../src/models/Program");
const Application = require("../src/models/Application");
const University = require("../src/models/University");
const { validStatusTransitions } = require("../src/config/constants");

describe("Study Abroad Backend Comprehensive Test Suite", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("1. Authentication & Security Flows", () => {
    test("POST /api/auth/register fails when required fields are missing", async () => {
      const response = await request(app).post("/api/auth/register").send({ email: "test@example.com" });
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Full name, email, and password are required/);
    });

    test("POST /api/auth/register enforces minimum password length", async () => {
      const response = await request(app).post("/api/auth/register").send({
        fullName: "Test Candidate",
        email: "test@example.com",
        password: "short"
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/at least 8 characters/);
    });

    test("POST /api/auth/login validates credentials presence", async () => {
      const response = await request(app).post("/api/auth/login").send({});
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Email and password are required/);
    });

    test("GET /api/auth/me rejects unauthorized requests", async () => {
      const response = await request(app).get("/api/auth/me");
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Authorization token missing/);
    });

    test("GET /api/auth/me returns user profile with valid Bearer token", async () => {
      const fakeUser = {
        _id: "64f1a2b3c4d5e6f7a8b9c0d1",
        fullName: "Aarav Malhotra",
        email: "aarav@example.com",
        role: "student"
      };

      const token = jwt.sign({ sub: fakeUser._id, role: fakeUser.role, email: fakeUser.email }, env.jwtSecret);

      jest.spyOn(Student, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUser)
      });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("aarav@example.com");
    });
  });

  describe("2. Application Workflow & State Machine Enforcement", () => {
    const studentToken = jwt.sign(
      { sub: "64f1a2b3c4d5e6f7a8b9c0d1", role: "student", email: "aarav@example.com" },
      env.jwtSecret
    );

    test("POST /api/applications enforces authentication", async () => {
      const response = await request(app).post("/api/applications").send({
        programId: "64f1a2b3c4d5e6f7a8b9c0d2",
        intake: "September"
      });
      expect(response.status).toBe(401);
    });

    test("POST /api/applications blocks duplicate applications for same student, program, intake", async () => {
      const fakeUser = { _id: "64f1a2b3c4d5e6f7a8b9c0d1", fullName: "Aarav", role: "student" };
      jest.spyOn(Student, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUser),
        then: (resolve) => resolve(fakeUser)
      });
      jest.spyOn(Program, "findById").mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "64f1a2b3c4d5e6f7a8b9c0d2",
          title: "MSc AI",
          intakes: ["September"],
          country: "Canada"
        })
      });
      jest.spyOn(Application, "findOne").mockResolvedValue({
        _id: "64f1a2b3c4d5e6f7a8b9c0d9",
        status: "submitted"
      });

      const response = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          studentId: fakeUser._id,
          programId: "64f1a2b3c4d5e6f7a8b9c0d2",
          intake: "September"
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already exists/);
    });

    test("PATCH /api/applications/:id/status rejects invalid state transitions (Edge Case)", async () => {
      const fakeUser = { _id: "64f1a2b3c4d5e6f7a8b9c0d1", role: "counselor" };
      jest.spyOn(Student, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUser)
      });

      // Draft application cannot directly jump to enrolled
      jest.spyOn(Application, "findById").mockResolvedValue({
        _id: "64f1a2b3c4d5e6f7a8b9c0d9",
        status: "draft",
        timeline: []
      });

      const response = await request(app)
        .patch("/api/applications/64f1a2b3c4d5e6f7a8b9c0d9/status")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ status: "enrolled" });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Invalid status transition from 'draft' to 'enrolled'/);
    });

    test("Verifies formal state machine configuration", () => {
      expect(validStatusTransitions.draft).toEqual(["submitted"]);
      expect(validStatusTransitions.submitted).toEqual(["under-review", "rejected"]);
      expect(validStatusTransitions["under-review"]).toEqual(["offer-received", "rejected"]);
      expect(validStatusTransitions["offer-received"]).toEqual(["visa-processing", "rejected"]);
      expect(validStatusTransitions["visa-processing"]).toEqual(["enrolled", "rejected"]);
      expect(validStatusTransitions.enrolled).toEqual([]);
      expect(validStatusTransitions.rejected).toEqual([]);
    });
  });

  describe("3. University & Program Discovery Caching & Filtering", () => {
    test("GET /api/universities/popular utilizes cache and returns items", async () => {
      jest.spyOn(University, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { name: "Heriot-Watt University Dubai", country: "UAE", popularScore: 92 }
        ])
      });

      const response = await request(app).get("/api/universities/popular");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.cache).toBeDefined();
    });

    test("GET /api/programs supports filtering and pagination shape", async () => {
      jest.spyOn(Program, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { title: "Master of Applied Computing", country: "Canada", tuitionFeeUsd: 21500 }
        ])
      });
      jest.spyOn(Program, "countDocuments").mockResolvedValue(1);

      const response = await request(app).get("/api/programs?country=Canada&page=1&limit=10");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.total).toBe(1);
      expect(response.body.meta.totalPages).toBe(1);
    });
  });
});
