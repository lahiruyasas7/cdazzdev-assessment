import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('CDAZZDEV Assessment API')
    .setDescription(
      `
## Authentication

|---|---|---|
| \`access_token\` | 15 minutes | Authenticates every API request |
| \`refresh_token\` | 7 days | Issues a new access token via POST /auth/refresh |
      `,
    )
    .setVersion('1.0')
    .setContact('Lahiru', '#', 'lahiruyasas7@gmail.com')
    .addServer('/api/v1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token', // referenced via @ApiBearerAuth('access-token') on protected routes
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      // Persist auth between page refreshes in Swagger UI
      persistAuthorization: true,

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
