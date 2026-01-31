import { generateOpenApi } from '@ts-rest/open-api';
import { watchlistsContract } from './watchlists.contract';
import * as fs from 'fs';
import * as path from 'path';

/**
 * OpenAPI Spec Generator
 *
 * Generates OpenAPI 3.0 specification from ts-rest contracts.
 * Run with: npx ts-node lambda/openapi.ts
 */
const openApiDocument = generateOpenApi(
  watchlistsContract,
  {
    info: {
      title: 'WorthWatch API',
      version: '1.0.0',
      description: 'WorthWatch backend API - Type-safe REST API for managing watchlists',
    },
    servers: [
      {
        url: 'https://api.worthwatch.example.com',
        description: 'Production',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development',
      },
    ],
  },
  {
    setOperationId: true,
    operationMapper: (operation, appRoute) => ({
      ...operation,
      tags: ['Watchlists'],
    }),
  }
);

// Write to file
const outputPath = path.join(__dirname, '../openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));

console.log('✅ OpenAPI spec generated at:', outputPath);
console.log('   View with: https://editor.swagger.io/');
