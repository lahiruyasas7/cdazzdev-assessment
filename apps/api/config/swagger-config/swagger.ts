import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('CDAZZDEV Assessment API')
    .setDescription(
      `
## Authentication
This API uses **HTTP-only cookies** for authentication — not Bearer tokens.

### How to authenticate in Swagger UI:
1. Call **POST /auth/login** or **POST /auth/register**
2. The server sets \`access_token\` and \`refresh_token\` cookies automatically
3. Your browser stores them — all subsequent requests send them automatically
4. No need to copy/paste tokens anywhere

### Cookie details
| Cookie | Lifetime | Purpose |
|---|---|---|
| \`access_token\` | 15 minutes | Authenticates every API request |
| \`refresh_token\` | 7 days | Issues a new access token via POST /auth/refresh |
      `,
    )
    .setVersion('1.0')
    .setContact('Lahiru', '#', 'lahiruyasas7@gmail.com')
    .addServer('/api/v1')
    .addCookieAuth(
      'access_token', // cookie name — must match what the server sets
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description:
          'HTTP-only access token cookie (set automatically on login)',
      },
      'cookie-auth', // security scheme name — used in @ApiCookieAuth('cookie-auth')
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      // Persist auth between page refreshes in Swagger UI
      persistAuthorization: true,

      // Since cookies are HTTP-only, Swagger UI can't read or display them
      // but the browser sends them automatically on every request
      withCredentials: true,

      tagsSorter: 'alpha',
      operationsSorter: 'alpha',

      // Collapse all endpoints by default for cleaner UI
      docExpansion: 'none',
    },
    customSiteTitle: 'CDAZZDEV Assessment API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar-wrapper .link span { color: #fff; }
      .swagger-ui .info .title { color: #1a1a2e; }
    `,
  });
};
