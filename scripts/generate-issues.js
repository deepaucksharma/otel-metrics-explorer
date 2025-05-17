/**
 * Script to generate GitHub issues from the implementation plan
 * 
 * Usage:
 * node scripts/generate-issues.js <phase-number> <github-token>
 * 
 * Example:
 * node scripts/generate-issues.js 0 ghp_12345abcdef
 */

import fs from 'fs';
import { Octokit } from '@octokit/rest';

// Constants
const REPO_OWNER = 'deepaucksharma';
const REPO_NAME = 'otel-metrics-explorer';
const IMPLEMENTATION_PLAN_PATH = './docs/72-implementation-Plan.md';

// Parse command line arguments
const phaseArg = process.argv[2];
const token = process.argv[3];

if (!phaseArg || !token) {
  console.error('Usage: node scripts/generate-issues.js <phase-number> <github-token>');
  process.exit(1);
}

const phaseNumber = parseInt(phaseArg, 10);
if (isNaN(phaseNumber) || phaseNumber < 0 || phaseNumber > 6) {
  console.error('Phase number must be between 0 and 6');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: token
});

// Read implementation plan
const implementationPlan = fs.readFileSync(IMPLEMENTATION_PLAN_PATH, 'utf8');

// Main function
async function main() {
  try {
    console.log(`Generating issues for Phase ${phaseNumber}...`);
    
    // Extract tasks for the specified phase
    const tasks = extractTasksForPhase(implementationPlan, phaseNumber);
    console.log(`Found ${tasks.length} tasks`);
    
    // Create milestone if it doesn't exist
    const milestone = await getOrCreateMilestone(phaseNumber);
    
    // Create issues
    for (const task of tasks) {
      await createIssue(task, milestone.number);
      console.log(`Created issue for ${task.id}: ${task.description}`);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Extract tasks for a specific phase
function extractTasksForPhase(plan, phase) {
  const tasks = [];
  
  // Find the phase section
  const phaseSectionRegex = new RegExp(`### Phase ${phase}[^#]*`, 'g');
  const phaseMatch = plan.match(phaseSectionRegex);
  
  if (!phaseMatch) {
    console.error(`Phase ${phase} not found in implementation plan`);
    return tasks;
  }
  
  const phaseContent = phaseMatch[0];
  
  // Parse the tasks tables
  const tableRegex = /\| ([0-9]+-[0-9]+[a-z]) \| ([^|]+) \| ([^|]+) \| ([0-9.]+d) \| ([^|]*) \|/g;
  let match;
  
  while ((match = tableRegex.exec(phaseContent)) !== null) {
    const [, id, ticket, description, duration, dependencies] = match;
    
    // Determine the track
    let track = 'unknown';
    if (id.includes('-')) {
      // Extract track from section headings or ID prefix
      const trackMatch = phaseContent.match(/#### Track ([A-Z]) — (.*)/);
      if (trackMatch) {
        track = trackMatch[1];
      } else {
        // Try to infer from ID
        const prefix = id.split('-')[0];
        switch (prefix) {
          case '1': track = 'A'; break;
          case '2': track = 'B'; break;
          case '3': track = 'C'; break;
          case '4': track = 'D'; break;
          case '5': track = 'E'; break;
        }
      }
    }
    
    // Determine if this is an interface task
    const isInterface = id.endsWith('a') && (ticket.includes('iface') || ticket.includes('def'));
    
    tasks.push({
      id,
      ticket: ticket.trim(),
      description: description.trim(),
      duration: duration.trim(),
      dependencies: dependencies.trim(),
      track,
      isInterface,
      phase
    });
  }
  
  return tasks;
}

// Get or create milestone
async function getOrCreateMilestone(phase) {
  const milestoneTitles = [
    'M0: Foundation',
    'M1: Basic Structure',
    'M2: Single Snapshot View',
    'M3: Diff Calculation',
    'M4: Cardinality Analysis',
    'M5: Config Export & Live Mode',
    'GA: Production Release'
  ];
  
  const title = milestoneTitles[phase];
  
  try {
    // Check if milestone exists
    const { data: milestones } = await octokit.issues.listMilestones({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'open'
    });
    
    const existing = milestones.find(m => m.title === title);
    if (existing) {
      return existing;
    }
    
    // Create new milestone
    const { data: milestone } = await octokit.issues.createMilestone({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title,
      description: `Tasks for Phase ${phase}`
    });
    
    return milestone;
  } catch (error) {
    console.error('Error with milestone:', error.message);
    throw error;
  }
}

// Create issue for a task
async function createIssue(task, milestoneNumber) {
  const issueType = task.isInterface ? 'Interface Definition' : 'Implementation Task';
  
  // Create labels
  const labels = [
    task.isInterface ? 'interface' : 'implementation',
    `track:${task.track}`,
    `phase:${task.phase}`
  ];
  
  // Generate issue body
  const body = generateIssueBody(task);
  
  try {
    await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `[${task.id}] ${task.description}`,
      body,
      labels,
      milestone: milestoneNumber
    });
  } catch (error) {
    console.error(`Error creating issue for ${task.id}:`, error.message);
    throw error;
  }
}

// Generate issue body based on template
function generateIssueBody(task) {
  if (task.isInterface) {
    return `## Interface Definition

**Ticket ID:** ${task.id}
**Track:** ${task.track}

### Purpose
${task.description}

### Dependencies
${task.dependencies || 'None'}

### Estimated Duration
${task.duration}

### Deliverables
- [ ] TypeScript interface/type definition
- [ ] Mock implementation that adheres to the interface
- [ ] Usage example for consumers
- [ ] Interface handshake meeting with consuming teams

This is an interface definition task that must be completed before implementation tickets can begin.`;
  } else {
    return `## Implementation Task

**Ticket ID:** ${task.id}
**Track:** ${task.track}

### Purpose
${task.description}

### Dependencies
${task.dependencies || 'None'}

### Estimated Duration
${task.duration}

### Acceptance Criteria
- [ ] Implementation follows the defined interface
- [ ] Unit tests cover all functionality
- [ ] Contract tests verify compatibility with consuming components
- [ ] Documentation is updated if needed

### Contract Tests
The following contract tests should verify the implementation:
- Contract test 1 (to be defined)
- Contract test 2 (to be defined)

This is an implementation task that depends on interface definition(s) being completed first.`;
  }
}

// Run the script
main();
