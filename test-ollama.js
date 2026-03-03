#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const { OLLAMA_API_URL, OLLAMA_MODEL } = process.env;

if (!OLLAMA_API_URL) {
  console.error('❌ OLLAMA_API_URL not configured in .env file');
  process.exit(1);
}

if (!OLLAMA_MODEL) {
  console.error('❌ OLLAMA_MODEL not configured in .env file');
  process.exit(1);
}

async function testOllama() {
  console.log(`🦙 Testing Ollama configuration...`);
  console.log(`   API URL: ${OLLAMA_API_URL}`);
  console.log(`   Model: ${OLLAMA_MODEL}\n`);

  try {
    // Test 1: Check if Ollama is running
    console.log('📡 Testing connection to Ollama...');
    const tagsResponse = await axios.get(`${OLLAMA_API_URL}/api/tags`, {
      timeout: 10000
    });
    
    const availableModels = tagsResponse.data.models.map(m => m.name);
    console.log(`✅ Ollama is running`);
    console.log(`   Available models: ${availableModels.join(', ')}\n`);

    // Test 2: Check if the configured model is available
    if (!availableModels.includes(OLLAMA_MODEL)) {
      console.error(`❌ Model '${OLLAMA_MODEL}' is not available`);
      console.log(`   Available models: ${availableModels.join(', ')}`);
      console.log(`   You may need to run: ollama pull ${OLLAMA_MODEL}`);
      process.exit(1);
    }

    console.log(`✅ Model '${OLLAMA_MODEL}' is available\n`);

    // Test 3: Test actual API call
    console.log('💬 Testing API call with a simple message...');
    const chatResponse = await axios.post(`${OLLAMA_API_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with just "Hello back!"'
        }
      ],
      stream: false
    }, {
      timeout: 30000
    });

    const response = chatResponse.data.message.content;
    console.log(`✅ API call successful`);
    console.log(`   Response: "${response.trim()}"\n`);

    console.log('🎉 All tests passed! Your Ollama configuration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused - is Ollama running?');
      console.error('   Make sure Ollama is installed and running with: ollama serve');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timed out - Ollama may be starting up slowly');
      console.error('   Try again in a moment or check if Ollama is running');
    } else if (error.response) {
      console.error(`   API error: ${error.response.status} ${error.response.statusText}`);
      if (error.response.data.error) {
        console.error(`   Details: ${error.response.data.error}`);
      }
    } else {
      console.error(`   ${error.message}`);
    }
    
    process.exit(1);
  }
}

testOllama();