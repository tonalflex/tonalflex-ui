import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, relative, sep } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Base directory for proto files
const protoBaseDir = join(__dirname, 'src', 'proto');

// Debug: Log environment
console.log('Node path:', process.execPath);
console.log('Working directory:', __dirname);

// Function to run protoc for a given proto directory
function generateProtoForDir(protoDir) {
  const relativeProtoDir = relative(__dirname, protoDir).split(sep).join('/');
  const protoFiles = readdirSync(protoDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.proto'))
    .map((entry) => join(relativeProtoDir, entry.name).split(sep).join('/'));

  if (protoFiles.length === 0) {
    console.log(`No .proto files found in ${relativeProtoDir}`);
    return;
  }

  // Output stubs to the same directory as the .proto files
  const outputDir = relativeProtoDir;

  // Resolve plugin path
  const pluginPath = join(__dirname, 'node_modules', 'ts-protoc-gen', 'bin', 'protoc-gen-ts').split(sep).join('/');
  console.log('Plugin path:', pluginPath);

  // Construct protoc command without --plugin
  const protocCmd = [
    process.platform === 'win32' ? 'SET "PATH=%PATH%;' + join(__dirname, 'node_modules', '.bin') + '" &&' : '',
    'protoc',
    `--ts_out="${outputDir}"`,
    `--ts_opt=client_generic`,
    `-I "${relativeProtoDir}"`,
    protoFiles.join(' '),
  ].join(' ');

  console.log(`Running: ${protocCmd}`);

  try {
    execSync(protocCmd, { stdio: 'inherit', shell: true, env: { ...process.env, PROTOC_GEN_TS_PATH: `node ${pluginPath}` } });
    console.log(`Generated stubs in ${outputDir}`);
  } catch (err) {
    console.error(`Error generating stubs for ${relativeProtoDir}:`, err.message);
    process.exit(1);
  }
}

// Find all proto subdirectories
function findProtoDirs(dir) {
  if (!existsSync(dir)) {
    console.log(`Proto base directory ${dir} does not exist`);
    return;
  }
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = join(dir, entry.name);
      generateProtoForDir(fullPath);
    }
  }
}

// Run generation
console.log('Generating protobuf stubs...');
findProtoDirs(protoBaseDir);