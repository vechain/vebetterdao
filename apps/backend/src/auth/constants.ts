if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

if (!process.env.JWT_EXPIRATION_TIME) {
  throw new Error("Missing JWT_EXPIRATION_TIME environment variable");
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRATION_TIME,
};

export const certMaxAge = process.env.JWT_CERT_MAX_AGE ?? "1w";
