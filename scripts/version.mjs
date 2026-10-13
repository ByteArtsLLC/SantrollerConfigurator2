// The configurator's version: major.minor from package.json, then the number of commits. Every
// push to main is released, and this goes up with each one. Run directly, it prints the version.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}

export function commitHash() {
  return git('rev-parse --short=8 HEAD') ?? 'unknown';
}

// A shallow clone would count from 1, so CI fetches the whole history first
export function appVersion() {
  const { version } = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'));
  const [major, minor] = version.split('.');
  return `${major}.${minor}.${git('rev-list --count HEAD') ?? 0}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(appVersion());
}
