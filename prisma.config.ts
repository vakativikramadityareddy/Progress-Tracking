import { config } from "dotenv";
import { resolve } from "path";

// Load the .env from the backend folder where it lives
config({ path: resolve(__dirname, "backend", ".env") });

export default {
    schema: "backend/prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL,
    },
};
