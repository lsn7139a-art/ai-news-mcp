#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { brightdataProxyRequest, scrapeWithBrightData } from './brightdata.js';

dotenv.config();

const server = new Server(
  {
    name: 'brightdata-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'proxy_request',
        description: 'Make HTTP requests through BrightData proxy',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to request',
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              default: 'GET',
              description: 'HTTP method',
            },
            headers: {
              type: 'object',
              description: 'HTTP headers',
              default: {},
            },
            body: {
              type: 'string',
              description: 'Request body (for POST/PUT)',
              default: '',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'scrape_webpage',
        description: 'Scrape webpage content using BrightData',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to scrape',
            },
            selector: {
              type: 'string',
              description: 'CSS selector to extract specific content',
              default: '',
            },
            wait_for: {
              type: 'string',
              description: 'CSS selector to wait for before scraping',
              default: '',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000,
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'get_proxy_info',
        description: 'Get current proxy configuration and status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'proxy_request': {
        const { url, method = 'GET', headers = {}, body = '' } = args;
        
        const response = await brightdataProxyRequest({
          url,
          method,
          headers,
          body,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
              }, null, 2),
            },
          ],
        };
      }

      case 'scrape_webpage': {
        const { url, selector = '', wait_for = '', timeout = 30000 } = args;
        
        const result = await scrapeWithBrightData({
          url,
          selector,
          waitFor: wait_for,
          timeout,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_proxy_info': {
        const info = {
          proxy_enabled: !!process.env.BRIGHTDATA_USERNAME,
          username: process.env.BRIGHTDATA_USERNAME ? '***configured***' : 'not set',
          password: process.env.BRIGHTDATA_PASSWORD ? '***configured***' : 'not set',
          proxy_host: process.env.BRIGHTDATA_HOST || 'brd.superproxy.io',
          proxy_port: process.env.BRIGHTDATA_PORT || '22225',
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

async function main() {
  console.error('Starting BrightData MCP Server...');
  
  // Check environment variables
  if (!process.env.BRIGHTDATA_USERNAME || !process.env.BRIGHTDATA_PASSWORD) {
    console.error('Warning: BrightData credentials not configured. Please set BRIGHTDATA_USERNAME and BRIGHTDATA_PASSWORD environment variables.');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BrightData MCP Server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}