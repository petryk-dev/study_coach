import { z, type ZodType } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendCodeSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/auth.schema';
import { createDeckSchema, NOTES_MAX_CHARS } from '../schemas/deck.schema';

// Request bodies come straight from the zod schemas the routes validate with,
// so the docs can't drift from what the API actually accepts.
function body(schema: ZodType, example: Record<string, unknown>) {
  const { $schema: _, ...jsonSchema } = z.toJSONSchema(schema, { io: 'input' });
  return {
    required: true,
    content: { 'application/json': { schema: jsonSchema, example } },
  };
}

const json = (schema: object, description: string) => ({
  description,
  content: { 'application/json': { schema } },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const errors = {
  validation: json(ref('Error'), 'Validation failed (`VALIDATION_ERROR`, see `details`)'),
  rateLimited: json(ref('Error'), 'Too many requests from this IP (`RATE_LIMITED`)'),
  invalidCode: json(ref('Error'), 'Invalid or expired code (`INVALID_CODE`)'),
  tooManyAttempts: json(ref('Error'), 'Too many wrong codes (`TOO_MANY_ATTEMPTS`) or code requested too soon (`TOO_SOON`)'),
  mailFailed: json(ref('Error'), 'Email could not be sent (`MAIL_FAILED`)'),
  unauthorized: json(ref('Error'), 'Missing/invalid token (`UNAUTHORIZED`) or expired (`TOKEN_EXPIRED`)'),
  deckNotFound: json(ref('Error'), "Deck doesn't exist or belongs to another user (`NOT_FOUND`)"),
};

const DECK_ID_PARAM = [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }];

const message = (text: string) =>
  json({ type: 'object', properties: { message: { type: 'string', example: text } } }, 'OK');

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Study Coach API',
    version: '1.0.0',
    description:
      'Auth flow: **register** → email code → **verify-email** (returns tokens) → use `accessToken` as a Bearer token. ' +
      'When it expires (15 min, `TOKEN_EXPIRED`), call **refresh** with the `refreshToken`. ' +
      'Each refresh token works once; reusing one logs out every session of that user.',
  },
  servers: [{ url: '/', description: 'This server' }],
  tags: [{ name: 'Health' }, { name: 'Auth' }, { name: 'Password reset' }, { name: 'Decks', description: 'Flashcard decks generated from notes. All routes need a Bearer token.' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'student@example.com' },
          name: { type: ['string', 'null'], example: 'Alex' },
          email_verified: { type: ['boolean', 'null'], example: true },
          push_token: { type: ['string', 'null'], example: null },
          created_at: { type: ['string', 'null'], format: 'date-time' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT, valid 15 minutes' },
          refreshToken: { type: 'string', description: 'JWT, valid 30 days, single use' },
        },
      },
      AuthResult: {
        allOf: [
          { type: 'object', properties: { user: ref('User') } },
          ref('AuthTokens'),
        ],
      },
      Card: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          deck_id: { type: 'integer', example: 1 },
          front: { type: 'string', example: 'Where does the Calvin cycle occur?' },
          back: { type: 'string', example: 'In the stroma.' },
          ease: { type: ['number', 'null'], example: 2.5 },
          interval: { type: ['integer', 'null'], example: 0 },
          repetitions: { type: ['integer', 'null'], example: 0 },
          lapses: { type: ['integer', 'null'], example: 0 },
          due_date: { type: ['string', 'null'], format: 'date-time' },
          created_at: { type: ['string', 'null'], format: 'date-time' },
        },
      },
      Deck: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Photosynthesis' },
          source_text: { type: ['string', 'null'], description: 'The original notes' },
          summary: { type: ['string', 'null'], example: 'Photosynthesis is the process...' },
          created_at: { type: ['string', 'null'], format: 'date-time' },
          cards: { type: 'array', items: ref('Card') },
        },
      },
      DeckListItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Photosynthesis' },
          summary: { type: ['string', 'null'] },
          created_at: { type: ['string', 'null'], format: 'date-time' },
          card_count: { type: 'integer', example: 8 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid or expired code' },
          code: { type: 'string', example: 'INVALID_CODE' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: json(
            { type: 'object', properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string', format: 'date-time' } } },
            'Server is up',
          ),
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        description: 'Creates an unverified user and emails a 6-digit verification code. Limit: 5 per hour per IP.',
        requestBody: body(registerSchema, { email: 'student@example.com', password: 'supersecret1', name: 'Alex' }),
        responses: {
          201: json(
            { type: 'object', properties: { user: ref('User'), message: { type: 'string' } } },
            'Account created, code sent',
          ),
          400: errors.validation,
          409: json(ref('Error'), 'Email already registered (`EMAIL_TAKEN`)'),
          429: errors.rateLimited,
          502: errors.mailFailed,
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with the code',
        description: 'Marks the email verified and logs the user in. Each code allows 5 wrong attempts and expires in 10 minutes.',
        requestBody: body(verifyEmailSchema, { email: 'student@example.com', code: '123456' }),
        responses: {
          200: json(ref('AuthResult'), 'Verified and logged in'),
          400: json(ref('Error'), 'Invalid/expired code (`INVALID_CODE`), already verified (`ALREADY_VERIFIED`) or validation error'),
          429: errors.tooManyAttempts,
        },
      },
    },
    '/auth/resend-code': {
      post: {
        tags: ['Auth'],
        summary: 'Resend the verification code',
        description: 'Same response whether or not the account exists. At most one code per minute.',
        requestBody: body(resendCodeSchema, { email: 'student@example.com' }),
        responses: {
          200: message('If the account exists and is not verified, a new code was sent'),
          400: errors.validation,
          429: errors.tooManyAttempts,
          502: errors.mailFailed,
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Limit: 10 failed attempts per 15 minutes per IP.',
        requestBody: body(loginSchema, { email: 'student@example.com', password: 'supersecret1' }),
        responses: {
          200: json(ref('AuthResult'), 'Logged in'),
          400: errors.validation,
          401: json(ref('Error'), 'Wrong email or password (`INVALID_CREDENTIALS`)'),
          403: json(ref('Error'), 'Email not verified yet (`EMAIL_NOT_VERIFIED`)'),
          429: errors.rateLimited,
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Get a new token pair',
        description: 'The sent refresh token is consumed. Store the new one.',
        requestBody: body(refreshSchema, { refreshToken: '<refresh token>' }),
        responses: {
          200: json(ref('AuthTokens'), 'New tokens'),
          400: errors.validation,
          401: json(ref('Error'), 'Invalid token (`INVALID_REFRESH_TOKEN`) or reused token (`REFRESH_TOKEN_REUSED`, all sessions revoked)'),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out this session',
        requestBody: body(refreshSchema, { refreshToken: '<refresh token>' }),
        responses: {
          204: { description: 'Logged out' },
          400: errors.validation,
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: json({ type: 'object', properties: { user: ref('User') } }, 'The logged-in user'),
          401: json(ref('Error'), 'Missing/invalid token (`UNAUTHORIZED`) or expired (`TOKEN_EXPIRED`)'),
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Password reset'],
        summary: 'Email a password reset code',
        description: 'Same response whether or not the account exists. At most one code per minute.',
        requestBody: body(forgotPasswordSchema, { email: 'student@example.com' }),
        responses: {
          200: message('If the account exists, a password reset code was sent'),
          400: errors.validation,
          429: errors.tooManyAttempts,
          502: errors.mailFailed,
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Password reset'],
        summary: 'Set a new password with the code',
        description: 'Logs out every existing session. The user then logs in with the new password.',
        requestBody: body(resetPasswordSchema, { email: 'student@example.com', code: '123456', newPassword: 'newpassword1' }),
        responses: {
          200: message('Password updated. Please log in with your new password'),
          400: errors.invalidCode,
          429: errors.tooManyAttempts,
        },
      },
    },
    '/decks': {
      post: {
        tags: ['Decks'],
        summary: 'Generate a deck from notes',
        description:
          'Generates flashcards and a summary from the notes using only facts in them, then saves the deck. ' +
          `Takes a few seconds (longer for long notes). Notes: 50 to ${NOTES_MAX_CHARS.toLocaleString('en')} characters. ` +
          'If no title is given, the first line of the notes is used. Limit: 20 per hour per user.',
        security: [{ bearerAuth: [] }],
        requestBody: body(createDeckSchema, {
          title: 'Photosynthesis',
          text:
            'Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to produce ' +
            'glucose and oxygen. It takes place mainly in the chloroplasts, which contain the pigment chlorophyll.',
        }),
        responses: {
          201: json({ type: 'object', properties: { deck: ref('Deck') } }, 'Deck created with its cards'),
          400: errors.validation,
          401: errors.unauthorized,
          422: json(ref('Error'), 'No cards could be made from the notes (`NO_CARDS`)'),
          429: errors.rateLimited,
          502: json(ref('Error'), 'The AI service failed (`GENERATION_FAILED`), try again'),
        },
      },
      get: {
        tags: ['Decks'],
        summary: "List the user's decks",
        description: 'Newest first. Cards are not included; use GET /decks/{id} for those.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: json({ type: 'object', properties: { decks: { type: 'array', items: ref('DeckListItem') } } }, 'Decks'),
          401: errors.unauthorized,
        },
      },
    },
    '/decks/{id}': {
      get: {
        tags: ['Decks'],
        summary: 'Get a deck with its cards',
        security: [{ bearerAuth: [] }],
        parameters: DECK_ID_PARAM,
        responses: {
          200: json({ type: 'object', properties: { deck: ref('Deck') } }, 'The deck'),
          400: json(ref('Error'), 'Invalid deck id (`VALIDATION_ERROR`)'),
          401: errors.unauthorized,
          404: errors.deckNotFound,
        },
      },
      delete: {
        tags: ['Decks'],
        summary: 'Delete a deck and its cards',
        security: [{ bearerAuth: [] }],
        parameters: DECK_ID_PARAM,
        responses: {
          204: { description: 'Deleted' },
          400: json(ref('Error'), 'Invalid deck id (`VALIDATION_ERROR`)'),
          401: errors.unauthorized,
          404: errors.deckNotFound,
        },
      },
    },
  },
};
