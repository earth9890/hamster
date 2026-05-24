import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  turn: {
    url?: string;
    username?: string;
    credential?: string;
  };
  jwt: {
    secret: string;
  };
  cors: {
    origin: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://hamster:password@localhost:5432/hamster_db',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  turn: {
    url: process.env.TURN_SERVER_URL,
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_CREDENTIAL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

export default config;
