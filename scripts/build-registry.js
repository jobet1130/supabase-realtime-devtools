#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  componentPath: 'components/ui/supabase-realtime-devtools.tsx',
  outputPath: 'install.json',
  registryConfig: {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "supabase-realtime-devtools",
    "type": "registry:component",
    "description": "A comprehensive realtime debugging tool for Supabase with self-broadcasting and channel monitoring capabilities.",
    "dependencies": ["lucide-react", "@supabase/supabase-js"],
    "registryDependencies": [
      "input",
      "button",
      "badge", 
      "card",
      "scroll-area",
      "switch"
    ]
  }
};

function escapeForJson(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

async function readComponentFile(filePath) {
  try {
    console.log(`📖 Reading component file: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf8');
    console.log(`✅ Successfully read component file (${content.length} characters)`);
    return content;
  } catch (error) {
    console.error(`❌ Error reading component file: ${error.message}`);
    throw error;
  }
}

function generateRegistry(componentContent) {
  console.log('🔄 Generating registry configuration...');
  
  const escapedContent = escapeForJson(componentContent);
  
  const registry = {
    ...CONFIG.registryConfig,
    files: [
      {
        path: "components/ui/supabase-realtime-devtools.tsx",
        content: escapedContent,
        type: "registry:component"
      }
    ]
  };
  
  console.log('✅ Registry configuration generated successfully');
  return registry;
}

async function writeRegistryFile(registry, outputPath) {
  try {
    console.log(`💾 Writing registry file: ${outputPath}`);
    
    const jsonContent = JSON.stringify(registry, null, 2);
    await fs.writeFile(outputPath, jsonContent, 'utf8');
    
    console.log(`✅ Registry file written successfully`);
    console.log(`📄 File size: ${(jsonContent.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`❌ Error writing registry file: ${error.message}`);
    throw error;
  }
}

async function validateComponentFile(filePath) {
  try {
    await fs.access(filePath);
  } catch (error) {
    console.error(`❌ Component file not found: ${filePath}`);
    console.error('Make sure the component file exists at the correct path.');
    throw error;
  }
}

async function buildRegistry() {
  console.log('🚀 Starting Supabase DevTools Registry Build...\n');
  
  try {
    await validateComponentFile(CONFIG.componentPath);
    const componentContent = await readComponentFile(CONFIG.componentPath);
    const registry = generateRegistry(componentContent);
    await writeRegistryFile(registry, CONFIG.outputPath);
    
    console.log('\n🎉 Build completed successfully!');
    console.log(`📦 Install with: npx shadcn@latest add https://raw.githubusercontent.com/Criztiandev/supabase-realtime-devtools/main/install.json`);
    
  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

buildRegistry();