import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/jwt.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const SALT_ROUNDS = 10;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are all required");
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: passwordHash,
  });

  const token = signToken(user._id.toString());
  res.status(201).json({ token, user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(user._id.toString());
  // .toJSON() (via the schema transform) strips the password hash.
  res.status(200).json({ token, user });
});

export const me = asyncHandler(async (req, res) => {
  // req.user was already loaded (without password) by the requireAuth middleware.
  res.status(200).json({ user: req.user });
});
